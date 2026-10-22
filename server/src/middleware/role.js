const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to ensure the user belongs to the workspace and has appropriate role.
 * Resolves workspace from:
 * 1. req.params.workspaceId or req.params.wid or req.params.id (if route is /workspaces/:id)
 * 2. req.body.workspace
 * 3. req.params.projectId or req.params.pid
 * 4. req.params.taskId or req.params.id (if route is /tasks/:id)
 */
const requireWorkspaceMember = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      let workspaceId = req.params.workspaceId || req.params.wid;

      // If workspace route itself
      if (!workspaceId && (req.baseUrl.includes('/workspaces') || req.originalUrl.includes('/workspaces/')) && req.params.id) {
        workspaceId = req.params.id;
      }

      // If project route
      const projectId = req.params.projectId || req.params.pid || (req.baseUrl.includes('/projects') ? req.params.id : null);
      if (!workspaceId && projectId) {
        const project = await Project.findById(projectId);
        if (!project) {
          throw new ApiError(404, 'Project not found');
        }
        workspaceId = project.workspace;
        req.project = project;
      }

      // If task route
      const taskId = req.params.taskId || (req.baseUrl.includes('/tasks') ? req.params.id : null);
      if (!workspaceId && taskId) {
        const task = await Task.findById(taskId);
        if (!task) {
          throw new ApiError(404, 'Task not found');
        }
        workspaceId = task.workspace;
        req.task = task;
      }

      // From body
      if (!workspaceId && req.body && req.body.workspace) {
        workspaceId = req.body.workspace;
      }

      if (!workspaceId) {
        throw new ApiError(400, 'Workspace context could not be determined');
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new ApiError(404, 'Workspace not found');
      }

      // Find user role in workspace
      let userRole = null;
      if (workspace.owner.toString() === req.user._id.toString()) {
        userRole = 'owner';
      } else {
        const member = workspace.members.find(
          (m) => m.user.toString() === req.user._id.toString()
        );
        if (member) {
          userRole = member.role;
        }
      }

      if (!userRole) {
        throw new ApiError(403, 'You are not a member of this workspace');
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        throw new ApiError(403, `Permission denied: Requires one of [${allowedRoles.join(', ')}] role`);
      }

      req.workspace = workspace;
      req.userRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireWorkspaceMember,
};
