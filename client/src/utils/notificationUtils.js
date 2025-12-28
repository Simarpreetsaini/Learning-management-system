import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format notification timestamp
 */
export const formatNotificationTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return formatDistanceToNow(date, { addSuffix: true });
  } else {
    return format(date, 'MMM dd, yyyy');
  }
};

/**
 * Get notification icon based on type
 */
export const getNotificationIcon = (type) => {
  const icons = {
    study_material: '📚',
    assignment: '📝',
    assignment_submission: '📤',
    test: '📋',
    test_submission: '📊',
    notice: '📢',
    grade: '🎯',
    attendance: '📅',
    system: '⚙️',
    reminder: '⏰',
    paid_note: '💎'
  };

  return icons[type] || '📬';
};

/**
 * Get notification color based on priority
 */
export const getNotificationColor = (priority) => {
  const colors = {
    low: 'text-gray-600 bg-gray-50',
    medium: 'text-blue-600 bg-blue-50',
    high: 'text-orange-600 bg-orange-50',
    urgent: 'text-red-600 bg-red-50'
  };

  return colors[priority] || colors.medium;
};

/**
 * Get notification border color based on priority
 */
export const getNotificationBorderColor = (priority) => {
  const colors = {
    low: 'border-gray-200',
    medium: 'border-blue-200',
    high: 'border-orange-200',
    urgent: 'border-red-200'
  };

  return colors[priority] || colors.medium;
};

/**
 * Get notification type display name
 */
export const getNotificationTypeDisplay = (type) => {
  const types = {
    study_material: 'Study Material',
    assignment: 'Assignment',
    assignment_submission: 'Assignment Submission',
    test: 'Test',
    test_submission: 'Test Submission',
    notice: 'Notice',
    grade: 'Grade',
    attendance: 'Attendance',
    system: 'System',
    reminder: 'Reminder',
    paid_note: 'Paid Note'
  };

  return types[type] || 'Notification';
};

/**
 * Get notification action URL based on type and related data
 */
export const getNotificationActionUrl = (notification, userRole = null) => {
  const { type, relatedId, relatedModel } = notification;

  switch (type) {
    case 'study_material':
      return `/study-materials`;
    case 'assignment':
      return `/assignments`;
    case 'assignment_submission':
      // For teachers, redirect to assignment submissions page
      // For students, redirect to assignments list
      if (userRole === 'Teacher') {
        return `/teacher/assignments/${relatedId}/submissions`;
      } else {
        return `/assignments`;
      }
    case 'test':
      return `/tests`;
    case 'test_submission':
      // For teachers, redirect to test submissions page
      // For students, redirect to tests list
      if (userRole === 'Teacher') {
        return `/teacher/tests/${relatedId}/submissions`;
      } else {
        return `/tests`;
      }
    case 'notice':
      return `/noticeboard`;
    case 'paid_note':
      return `/paid-notes`;
    case 'grade':
      return `/assignments`;
    case 'attendance':
      return `/attendance`;
    default:
      return '/dashboard';
  }
};

/**
 * Group notifications by date
 */
export const groupNotificationsByDate = (notifications) => {
  const groups = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  notifications.forEach(notification => {
    const notificationDate = new Date(notification.createdAt);
    let groupKey;

    if (notificationDate.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (notificationDate.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else {
      groupKey = format(notificationDate, 'MMMM dd, yyyy');
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });

  return groups;
};

/**
 * Filter notifications by type
 */
export const filterNotificationsByType = (notifications, types) => {
  if (!types || types.length === 0) return notifications;
  return notifications.filter(notification => types.includes(notification.type));
};

/**
 * Filter notifications by read status
 */
export const filterNotificationsByReadStatus = (notifications, showUnreadOnly = false) => {
  if (!showUnreadOnly) return notifications;
  return notifications.filter(notification => !notification.isRead);
};

/**
 * Sort notifications by priority and date
 */
export const sortNotifications = (notifications) => {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  
  return notifications.sort((a, b) => {
    // First sort by read status (unread first)
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    
    // Then by priority
    const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    
    // Finally by date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

/**
 * Get notification summary text
 */
export const getNotificationSummary = (notifications) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalCount = notifications.length;
  
  if (unreadCount === 0) {
    return `All caught up! ${totalCount} notifications`;
  }
  
  return `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`;
};

/**
 * Truncate notification message
 */
export const truncateMessage = (message, maxLength = 100) => {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};

/**
 * Check if notification is recent (within last 24 hours)
 */
export const isRecentNotification = (timestamp) => {
  const notificationDate = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - notificationDate) / (1000 * 60 * 60);
  return diffInHours < 24;
};

/**
 * Get notification badge count display
 */
export const getBadgeCount = (count) => {
  if (count === 0) return '';
  if (count > 99) return '99+';
  return count.toString();
};
