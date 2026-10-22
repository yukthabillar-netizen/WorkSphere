const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const { emitToWorkspace, emitToProject } = require('../sockets/socket');

// Helper to populate task consistently
const populateTask = (query) => {
  return query
    .populate('assignees', 'name email avatarUrl')
    .populate('createdBy', 'name email avatarUrl')
    .populate('project', 'name color icon');
};

// @desc    List tasks for a project with filters
// @route   GET /api/v1/projects/:pid/tasks
exports.getProjectTasks = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const { status, priority, assignee, label, due, q } = req.query;

  const filter = {
    project: pid,
    deletedAt: null,
  };

  if (status) {
    filter.status = status;
  }
  if (priority) {
    filter.priority = priority;
  }
  if (assignee) {
    filter.assignees = assignee;
  }
  if (label) {
    filter.labels = label;
  }
  if (q) {
    filter.title = { $regex: q, $options: 'i' };
  }

  // Due date filter
  if (due) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (due === 'overdue') {
      filter.dueDate = { $lt: startOfToday };
      filter.status = { $ne: 'done' };
    } else if (due === 'today') {
      filter.dueDate = { $gte: startOfToday, $lte: endOfToday };
    } else if (due === 'this_week') {
      const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
      filter.dueDate = { $gte: startOfToday, $lte: endOfWeek };
    }
  }

  const tasks = await populateTask(Task.find(filter).sort({ order: 1, createdAt: 1 }));

  res.json({
    success: true,
    data: tasks,
  });
});

// @desc    Create a task
// @route   POST /api/v1/projects/:pid/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const project = req.project || (await Project.findById(pid));
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const {
    title,
    description,
    status = 'todo',
    priority = 'medium',
    assignees = [],
    labels = [],
    dueDate,
    subtasks = [],
  } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, 'Task title is required');
  }

  // Calculate order: place at bottom of specified column
  const lastTaskInColumn = await Task.findOne({
    project: pid,
    status,
    deletedAt: null,
  }).sort({ order: -1 });

  const order = lastTaskInColumn ? lastTaskInColumn.order + 1 : 0;

  const task = new Task({
    workspace: project.workspace,
    project: pid,
    title: title.trim(),
    description: description || '',
    status,
    priority,
    assignees,
    labels,
    dueDate: dueDate || null,
    subtasks,
    order,
    createdBy: req.user._id,
  });

  await task.save();

  const populated = await populateTask(Task.findById(task._id));

  // Log activity
  await logActivity({
    workspace: project.workspace,
    project: pid,
    task: task._id,
    actor: req.user._id,
    action: 'created_task',
    meta: { title: task.title, status: task.status },
  });

  // Notify assignees
  if (Array.isArray(assignees)) {
    for (const assigneeId of assignees) {
      if (assigneeId.toString() !== req.user._id.toString()) {
        await createNotification({
          user: assigneeId,
          type: 'assigned',
          task: task._id,
          project: pid,
          actor: req.user._id,
          message: `${req.user.name} assigned you to task "${task.title}"`,
        });
      }
    }
  }

  // Realtime emit
  emitToProject(pid, 'task:created', populated);
  emitToWorkspace(project.workspace.toString(), 'task:created', populated);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: populated,
  });
});

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
exports.getTaskById = asyncHandler(async (req, res) => {
  const task = await populateTask(Task.findById(req.params.id));
  if (!task || task.deletedAt) {
    throw new ApiError(404, 'Task not found');
  }

  res.json({
    success: true,
    data: task,
  });
});

// @desc    Update task
// @route   PATCH /api/v1/tasks/:id
exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task || task.deletedAt) {
    throw new ApiError(404, 'Task not found');
  }

  // Permission check from PRD §4:
  // Owner & Admin can edit any task; Member can edit own or assigned only
  if (req.userRole === 'member') {
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignees.some((a) => a.toString() === req.user._id.toString());
    if (!isCreator && !isAssignee) {
      throw new ApiError(403, 'Members can only edit tasks they created or are assigned to');
    }
  }

  const {
    title,
    description,
    status,
    priority,
    assignees,
    labels,
    dueDate,
    subtasks,
  } = req.body;

  const previousStatus = task.status;
  const previousAssignees = task.assignees.map((a) => a.toString());

  if (title) task.title = title.trim();
  if (description !== undefined) task.description = description;
  if (priority) task.priority = priority;
  if (labels !== undefined) task.labels = labels;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (subtasks !== undefined) task.subtasks = subtasks;

  if (status && status !== previousStatus) {
    task.status = status;
    if (status === 'done') {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }
  }

  if (assignees !== undefined) {
    task.assignees = assignees;
  }

  await task.save();

  const populated = await populateTask(Task.findById(task._id));

  // Activity & Notifications for status change
  if (status && status !== previousStatus) {
    await logActivity({
      workspace: task.workspace,
      project: task.project,
      task: task._id,
      actor: req.user._id,
      action: 'status_changed',
      meta: { from: previousStatus, to: status, title: task.title },
    });

    // Notify task creator and assignees
    const notifyRecipients = new Set([
      task.createdBy.toString(),
      ...task.assignees.map((a) => a._id?.toString() || a.toString()),
    ]);

    for (const recipientId of notifyRecipients) {
      if (recipientId !== req.user._id.toString()) {
        await createNotification({
          user: recipientId,
          type: 'status_changed',
          task: task._id,
          project: task.project,
          actor: req.user._id,
          message: `${req.user.name} moved "${task.title}" to ${status.replace('_', ' ')}`,
        });
      }
    }
  }

  // Notify newly assigned members
  if (assignees !== undefined) {
    const newAssignees = assignees.filter((a) => !previousAssignees.includes(a.toString()));
    for (const newAssigneeId of newAssignees) {
      if (newAssigneeId.toString() !== req.user._id.toString()) {
        await createNotification({
          user: newAssigneeId,
          type: 'assigned',
          task: task._id,
          project: task.project,
          actor: req.user._id,
          message: `${req.user.name} assigned you to task "${task.title}"`,
        });
      }
    }
  }

  // Realtime emit
  emitToProject(task.project.toString(), 'task:updated', populated);
  emitToWorkspace(task.workspace.toString(), 'task:updated', populated);

  res.json({
    success: true,
    message: 'Task updated',
    data: populated,
  });
});

// @desc    Move task (Kanban drag-and-drop & reorder)
// @route   PATCH /api/v1/tasks/:id/move
exports.moveTask = asyncHandler(async (req, res) => {
  const { status, order } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task || task.deletedAt) {
    throw new ApiError(404, 'Task not found');
  }

  const prevStatus = task.status;
  const newStatus = status || prevStatus;
  const newOrder = typeof order === 'number' ? order : 0;

  // Reorder affected column tasks
  if (prevStatus === newStatus) {
    // Reordering within the same column
    await Task.updateMany(
      {
        project: task.project,
        status: newStatus,
        _id: { $ne: task._id },
        order: { $gte: newOrder },
        deletedAt: null,
      },
      { $inc: { order: 1 } }
    );
  } else {
    // Moving between columns
    // 1. Shift remaining tasks in old column down
    await Task.updateMany(
      {
        project: task.project,
        status: prevStatus,
        _id: { $ne: task._id },
        order: { $gt: task.order },
        deletedAt: null,
      },
      { $inc: { order: -1 } }
    );

    // 2. Shift tasks in new column up
    await Task.updateMany(
      {
        project: task.project,
        status: newStatus,
        order: { $gte: newOrder },
        deletedAt: null,
      },
      { $inc: { order: 1 } }
    );
  }

  task.status = newStatus;
  task.order = newOrder;
  if (newStatus === 'done' && prevStatus !== 'done') {
    task.completedAt = new Date();
  } else if (newStatus !== 'done' && prevStatus === 'done') {
    task.completedAt = null;
  }

  await task.save();

  const populated = await populateTask(Task.findById(task._id));

  if (prevStatus !== newStatus) {
    await logActivity({
      workspace: task.workspace,
      project: task.project,
      task: task._id,
      actor: req.user._id,
      action: 'moved_task',
      meta: { from: prevStatus, to: newStatus, title: task.title },
    });
  }

  emitToProject(task.project.toString(), 'task:moved', populated);
  emitToWorkspace(task.workspace.toString(), 'task:moved', populated);

  res.json({
    success: true,
    message: 'Task moved successfully',
    data: populated,
  });
});

// @desc    Soft delete task (with undo window)
// @route   DELETE /api/v1/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  task.deletedAt = new Date();
  await task.save();

  await logActivity({
    workspace: task.workspace,
    project: task.project,
    actor: req.user._id,
    action: 'deleted_task',
    meta: { title: task.title },
  });

  emitToProject(task.project.toString(), 'task:deleted', { taskId: task._id });
  emitToWorkspace(task.workspace.toString(), 'task:deleted', { taskId: task._id });

  res.json({
    success: true,
    message: 'Task moved to trash',
    data: { taskId: task._id },
  });
});

// @desc    Restore task (Undo delete)
// @route   POST /api/v1/tasks/:id/restore
exports.restoreTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  task.deletedAt = null;
  await task.save();

  const populated = await populateTask(Task.findById(task._id));

  await logActivity({
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    actor: req.user._id,
    action: 'restored_task',
    meta: { title: task.title },
  });

  emitToProject(task.project.toString(), 'task:created', populated);
  emitToWorkspace(task.workspace.toString(), 'task:created', populated);

  res.json({
    success: true,
    message: 'Task restored successfully',
    data: populated,
  });
});

// @desc    Get my tasks across the workspace
// @route   GET /api/v1/tasks/mine
exports.getMyTasks = asyncHandler(async (req, res) => {
  const { workspaceId } = req.query;
  const wsId = workspaceId || req.user.lastActiveWorkspace;

  const filter = {
    assignees: req.user._id,
    deletedAt: null,
  };

  if (wsId) {
    filter.workspace = wsId;
  }

  const tasks = await populateTask(Task.find(filter).sort({ dueDate: 1, createdAt: -1 }));

  // Group into Overdue, Today, Upcoming, No Date
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const grouped = {
    overdue: [],
    today: [],
    upcoming: [],
    noDate: [],
  };

  tasks.forEach((t) => {
    if (!t.dueDate) {
      grouped.noDate.push(t);
    } else {
      const d = new Date(t.dueDate);
      if (d < startOfToday && t.status !== 'done') {
        grouped.overdue.push(t);
      } else if (d >= startOfToday && d <= endOfToday) {
        grouped.today.push(t);
      } else {
        grouped.upcoming.push(t);
      }
    }
  });

  res.json({
    success: true,
    data: {
      all: tasks,
      grouped,
    },
  });
});
