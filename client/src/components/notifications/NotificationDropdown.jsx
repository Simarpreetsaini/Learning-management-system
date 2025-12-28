import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notificationApi';
import {
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor,
  getNotificationActionUrl,
  truncateMessage,
  getNotificationSummary
} from '../../utils/notificationUtils';
import { toast } from '../../utils/toast';

const NotificationDropdown = ({ onViewAll, onNotificationUpdate, onClose, isMobile = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications(1, 5); // Get latest 5 notifications
      if (response.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if not already read
      if (!notification.isRead) {
        await markAsRead(notification._id);
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        onNotificationUpdate();
      }

      // Navigate to the related page with user role
      const actionUrl = getNotificationActionUrl(notification, user?.role);
      onClose();
      navigate(actionUrl);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still navigate even if marking as read fails
      const actionUrl = getNotificationActionUrl(notification, user?.role);
      onClose();
      navigate(actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      await markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      onNotificationUpdate();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <div className={`bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col ${
        isMobile 
          ? 'fixed inset-x-4 top-20 bottom-4 z-50 max-h-none' 
          : 'max-h-96 w-80'
      }`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg">
        <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-xl' : 'text-lg'}`}>
          Notifications
        </h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 px-2 py-1 rounded"
            >
              {markingAllRead ? 'Marking...' : 'Mark all read'}
            </button>
          )}
          {isMobile && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              aria-label="Close notifications"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto bg-white ${isMobile ? 'touch-manipulation' : ''}`}>
        {loading ? (
          <div className={`text-center ${isMobile ? 'p-8' : 'p-4'}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-3">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={`text-center ${isMobile ? 'p-12' : 'p-6'}`}>
            <div className={`mb-4 ${isMobile ? 'text-6xl' : 'text-4xl'}`}>🔔</div>
            <p className={`text-gray-500 ${isMobile ? 'text-base' : 'text-sm'}`}>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`hover:bg-gray-50 cursor-pointer transition-colors touch-manipulation ${
                  !notification.isRead ? 'bg-blue-50' : ''
                } ${isMobile ? 'p-5' : 'p-4'}`}
              >
                <div className={`flex items-start ${isMobile ? 'space-x-4' : 'space-x-3'}`}>
                  {/* Icon */}
                  <div className={`flex-shrink-0 rounded-full flex items-center justify-center ${
                    isMobile ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm'
                  } ${getNotificationColor(notification.priority)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                      } ${isMobile ? 'text-base' : 'text-sm'}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className={`bg-blue-600 rounded-full flex-shrink-0 ${
                          isMobile ? 'w-3 h-3' : 'w-2 h-2'
                        }`}></div>
                      )}
                    </div>
                    <p className={`text-gray-600 mt-1 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                      {truncateMessage(notification.message, isMobile ? 120 : 80)}
                    </p>
                    <p className={`text-gray-400 mt-2 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                      {formatNotificationTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className={`border-t border-gray-200 bg-white rounded-b-lg ${isMobile ? 'px-5 py-4' : 'px-4 py-3'}`}>
          <div className="flex items-center justify-between">
            <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-xs'}`}>
              {getNotificationSummary(notifications)}
            </p>
            <button
              onClick={onViewAll}
              className={`text-blue-600 hover:text-blue-800 font-medium ${
                isMobile ? 'text-base px-3 py-2 rounded-lg hover:bg-blue-50' : 'text-sm'
              }`}
            >
              View all
            </button>
          </div>
        </div>
      )}
      
      </div>
    </>
  );
};

export default NotificationDropdown;
