const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../services/dataService');

// @desc    Get current user notifications
// @route   GET /api/notifications
// @access  Private (User)
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const notifications = await getUserNotifications(userId);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (User)
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const notification = await markNotificationAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private (User)
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    await markAllNotificationsAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markRead,
  markAllRead
};
