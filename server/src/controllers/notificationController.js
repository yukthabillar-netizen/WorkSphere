const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    List current user's notifications
// @route   GET /api/v1/notifications
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const filter = { user: req.user._id };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('actor', 'name email avatarUrl')
      .populate('task', 'title')
      .populate('project', 'name color icon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      total,
      unreadCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});

// @desc    Mark single notification as read
// @route   PATCH /api/v1/notifications/:id/read
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  notification.read = true;
  await notification.save();

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification,
  });
});

// @desc    Mark all user's notifications as read
// @route   PATCH /api/v1/notifications/read-all
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});
