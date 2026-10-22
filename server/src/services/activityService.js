const Activity = require('../models/Activity');
const { emitToWorkspace, emitToProject } = require('../sockets/socket');

const logActivity = async ({ workspace, project, task, actor, action, meta = {} }) => {
  try {
    const activity = new Activity({
      workspace,
      project,
      task,
      actor,
      action,
      meta,
    });
    await activity.save();

    const populated = await Activity.findById(activity._id)
      .populate('actor', 'name email avatarUrl')
      .populate('task', 'title')
      .populate('project', 'name color icon');

    // Emit realtime event
    if (workspace) {
      emitToWorkspace(workspace.toString(), 'activity:new', populated);
    }
    if (project) {
      emitToProject(project.toString(), 'activity:new', populated);
    }

    return populated;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = {
  logActivity,
};
