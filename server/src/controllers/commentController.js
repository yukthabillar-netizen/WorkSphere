const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const { emitToWorkspace, emitToProject } = require('../sockets/socket');

// @desc    Get comments for a task
// @route   GET /api/v1/tasks/:id/comments
exports.getTaskComments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comments = await Comment.find({ task: id })
    .populate('author', 'name email avatarUrl')
    .populate('mentions', 'name email avatarUrl')
    .sort({ createdAt: 1 });

  res.json({
    success: true,
    data: comments,
  });
});

// @desc    Add comment to a task
// @route   POST /api/v1/tasks/:id/comments
exports.addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { body, mentions = [] } = req.body;

  if (!body || !body.trim()) {
    throw new ApiError(400, 'Comment text cannot be empty');
  }

  const task = await Task.findById(id);
  if (!task || task.deletedAt) {
    throw new ApiError(404, 'Task not found');
  }

  const comment = new Comment({
    task: id,
    author: req.user._id,
    body: body.trim(),
    mentions: Array.isArray(mentions) ? mentions : [],
  });

  await comment.save();

  const populated = await Comment.findById(comment._id)
    .populate('author', 'name email avatarUrl')
    .populate('mentions', 'name email avatarUrl');

  // Log activity
  await logActivity({
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    actor: req.user._id,
    action: 'commented',
    meta: { taskTitle: task.title, snippet: body.substring(0, 60) },
  });

  // Notify mentioned users
  if (Array.isArray(mentions) && mentions.length > 0) {
    for (const mentionedId of mentions) {
      if (mentionedId.toString() !== req.user._id.toString()) {
        await createNotification({
          user: mentionedId,
          type: 'mentioned',
          task: task._id,
          project: task.project,
          actor: req.user._id,
          message: `${req.user.name} mentioned you in a comment on "${task.title}"`,
        });
      }
    }
  }

  // Also notify assignees who were not explicitly mentioned
  const assigneeIds = task.assignees.map((a) => a.toString());
  for (const assigneeId of assigneeIds) {
    if (
      assigneeId !== req.user._id.toString() &&
      !mentions.map((m) => m.toString()).includes(assigneeId)
    ) {
      await createNotification({
        user: assigneeId,
        type: 'comment',
        task: task._id,
        project: task.project,
        actor: req.user._id,
        message: `${req.user.name} commented on "${task.title}"`,
      });
    }
  }

  emitToProject(task.project.toString(), 'comment:created', populated);
  emitToWorkspace(task.workspace.toString(), 'comment:created', populated);

  res.status(201).json({
    success: true,
    message: 'Comment added',
    data: populated,
  });
});

// @desc    Edit comment
// @route   PATCH /api/v1/comments/:id
exports.updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;

  const comment = await Comment.findById(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only edit your own comments');
  }

  comment.body = body.trim();
  comment.editedAt = new Date();
  await comment.save();

  const populated = await Comment.findById(comment._id)
    .populate('author', 'name email avatarUrl')
    .populate('mentions', 'name email avatarUrl');

  res.json({
    success: true,
    message: 'Comment updated',
    data: populated,
  });
});

// @desc    Delete comment
// @route   DELETE /api/v1/comments/:id
exports.deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await Comment.findById(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const isAuthor = comment.author.toString() === req.user._id.toString();
  // If not author, check if user is admin/owner of task workspace
  if (!isAuthor) {
    const task = await Task.findById(comment.task);
    if (!task) {
      throw new ApiError(403, 'Permission denied');
    }
    // We can allow if admin/owner
    if (req.userRole !== 'owner' && req.userRole !== 'admin') {
      throw new ApiError(403, 'You can only delete your own comments');
    }
  }

  await Comment.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Comment deleted',
  });
});
