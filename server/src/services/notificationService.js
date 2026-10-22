const Notification = require('../models/Notification');
const { getIO } = require('../sockets/socket');

const createNotification = async ({ user, type, task, project, actor, message }) => {
  try {
    // Don't notify oneself
    if (actor && user.toString() === actor.toString()) {
      return null;
    }

    const notification = new Notification({
      user,
      type,
      task,
      project,
      actor,
      message,
    });
    await notification.save();

    const populated = await Notification.findById(notification._id)
      .populate('actor', 'name email avatarUrl')
      .populate('task', 'title')
      .populate('project', 'name color icon');

    // Emit to user if connected
    const io = getIO();
    if (io) {
      // Broadcast to user socket or workspace
      io.emit(`notification:${user.toString()}`, populated);
      io.emit('notification:new', populated);
    }

    return populated;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  createNotification,
};
