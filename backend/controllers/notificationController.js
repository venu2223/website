const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

const sendResponse = (res, statusCode, message, data = null, success = true) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  res.status(statusCode).json(response);
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    const notifications = await Notification.getUserNotifications(userId, parseInt(limit));
    const unreadCount = await Notification.getUnreadCount(userId);

    sendResponse(res, 200, 'Notifications retrieved successfully', {
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    sendResponse(res, 500, 'Failed to retrieve notifications', null, false);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const success = await Notification.markAsRead(notificationId, userId);
    if (!success) {
      return sendResponse(res, 404, 'Notification not found', null, false);
    }

    sendResponse(res, 200, 'Notification marked as read');
  } catch (error) {
    console.error('Mark notification as read error:', error);
    sendResponse(res, 500, 'Failed to mark notification as read', null, false);
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    const count = await Notification.markAllAsRead(userId);

    sendResponse(res, 200, `Marked ${count} notifications as read`, { count });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    sendResponse(res, 500, 'Failed to mark notifications as read', null, false);
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const count = await Notification.getUnreadCount(userId);

    sendResponse(res, 200, 'Unread count retrieved', { unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    sendResponse(res, 500, 'Failed to get unread count', null, false);
  }
};