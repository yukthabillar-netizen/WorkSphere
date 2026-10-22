const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityService');
const { emitToWorkspace } = require('../sockets/socket');

// Helper to compute progress for projects
const attachProjectProgress = async (project) => {
  const totalTasks = await Task.countDocuments({
    project: project._id,
    deletedAt: null,
  });
  const doneTasks = await Task.countDocuments({
    project: project._id,
    status: 'done',
    deletedAt: null,
  });
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  return {
    ...project.toObject(),
    totalTasks,
    doneTasks,
    progress,
  };
};

// @desc    List projects in workspace with progress
// @route   GET /api/v1/workspaces/:wid/projects
exports.getWorkspaceProjects = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { status, q } = req.query;

  const filter = { workspace: wid };
  if (status) {
    filter.status = status;
  }
  if (q) {
    filter.name = { $regex: q, $options: 'i' };
  }

  const projects = await Project.find(filter)
    .populate('members', 'name email avatarUrl')
    .populate('createdBy', 'name email avatarUrl')
    .sort({ createdAt: -1 });

  // Attach progress metrics to each project
  const projectsWithProgress = await Promise.all(
    projects.map((proj) => attachProjectProgress(proj))
  );

  res.json({
    success: true,
    data: projectsWithProgress,
  });
});

// @desc    Create project
// @route   POST /api/v1/workspaces/:wid/projects
exports.createProject = asyncHandler(async (req, res) => {
  const { wid } = req.params;
  const { name, description, color, icon, status, startDate, dueDate, members } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Project name is required');
  }

  const project = new Project({
    workspace: wid,
    name: name.trim(),
    description: description || '',
    color: color || '#6366f1',
    icon: icon || '📁',
    status: status || 'active',
    startDate: startDate || null,
    dueDate: dueDate || null,
    members: Array.isArray(members) ? members : [req.user._id],
    createdBy: req.user._id,
  });

  await project.save();

  const populated = await Project.findById(project._id)
    .populate('members', 'name email avatarUrl')
    .populate('createdBy', 'name email avatarUrl');

  const withProgress = await attachProjectProgress(populated);

  await logActivity({
    workspace: wid,
    project: project._id,
    actor: req.user._id,
    action: 'created_project',
    meta: { name: project.name },
  });

  emitToWorkspace(wid, 'project:created', withProgress);

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: withProgress,
  });
});

// @desc    Get project details with progress
// @route   GET /api/v1/projects/:id
exports.getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('members', 'name email avatarUrl')
    .populate('createdBy', 'name email avatarUrl')
    .populate('workspace', 'name accentColor owner members');

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const withProgress = await attachProjectProgress(project);

  res.json({
    success: true,
    data: withProgress,
  });
});

// @desc    Update project
// @route   PATCH /api/v1/projects/:id
exports.updateProject = asyncHandler(async (req, res) => {
  const project = req.project;
  const { name, description, color, icon, status, startDate, dueDate, members } = req.body;

  if (name) project.name = name.trim();
  if (description !== undefined) project.description = description;
  if (color) project.color = color;
  if (icon) project.icon = icon;
  if (status) project.status = status;
  if (startDate !== undefined) project.startDate = startDate;
  if (dueDate !== undefined) project.dueDate = dueDate;
  if (members !== undefined && Array.isArray(members)) project.members = members;

  await project.save();

  const populated = await Project.findById(project._id)
    .populate('members', 'name email avatarUrl')
    .populate('createdBy', 'name email avatarUrl');

  const withProgress = await attachProjectProgress(populated);

  await logActivity({
    workspace: project.workspace,
    project: project._id,
    actor: req.user._id,
    action: 'updated_project',
    meta: { name: project.name, status: project.status },
  });

  emitToWorkspace(project.workspace.toString(), 'project:updated', withProgress);

  res.json({
    success: true,
    message: 'Project updated',
    data: withProgress,
  });
});

// @desc    Delete or archive project
// @route   DELETE /api/v1/projects/:id
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = req.project;

  // Soft delete or remove project and related tasks
  await Task.updateMany({ project: project._id }, { deletedAt: new Date() });
  await Project.findByIdAndDelete(project._id);

  await logActivity({
    workspace: project.workspace,
    actor: req.user._id,
    action: 'deleted_project',
    meta: { name: project.name },
  });

  emitToWorkspace(project.workspace.toString(), 'project:deleted', { projectId: project._id });

  res.json({
    success: true,
    message: 'Project deleted successfully',
  });
});

// @desc    Get project activity feed
// @route   GET /api/v1/projects/:id/activity
exports.getProjectActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50 } = req.query;

  const activities = await Activity.find({ project: id })
    .populate('actor', 'name email avatarUrl')
    .populate('task', 'title')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10));

  res.json({
    success: true,
    data: activities,
  });
});
