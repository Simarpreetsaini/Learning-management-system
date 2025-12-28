import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  getNotifications,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification
} from '../api/notificationApi';
import {
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor,
  getNotificationBorderColor,
  getNotificationTypeDisplay,
  getNotificationActionUrl,
  groupNotificationsByDate,
  filterNotificationsByType,
  filterNotificationsByReadStatus,
  sortNotifications,
  getNotificationSummary
} from '../utils/notificationUtils';
import { showToast } from '../utils/toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    showUnreadOnly: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for very narrow screens
  const isNarrowScreen = isMobile && window.innerWidth < 375;

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  const fetchNotifications = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await getNotifications(page, 20);
      if (response.success) {
        if (page === 1) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        setTotalPages(response.data.totalPages);
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showToast.error('Failed to load notifications');
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
      }

      // Navigate to the related page with user role
      const actionUrl = getNotificationActionUrl(notification, user?.role);
      navigate(actionUrl);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still navigate even if marking as read fails
      const actionUrl = getNotificationActionUrl(notification, user?.role);
      navigate(actionUrl);
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    const filteredNotifications = getFilteredNotifications();
    const allSelected = filteredNotifications.every(n => selectedNotifications.includes(n._id));
    
    if (allSelected) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n._id));
    }
  };

  const handleMarkSelectedAsRead = async () => {
    try {
      await markMultipleAsRead(selectedNotifications);
      setNotifications(prev =>
        prev.map(n =>
          selectedNotifications.includes(n._id) ? { ...n, isRead: true } : n
        )
      );
      setSelectedNotifications([]);
      showToast.success('Selected notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      showToast.error('Failed to mark notifications as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      showToast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast.error('Failed to mark all as read');
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm('Are you sure you want to delete the selected notifications?')) {
      return;
    }

    try {
      await Promise.all(selectedNotifications.map(id => deleteNotification(id)));
      setNotifications(prev =>
        prev.filter(n => !selectedNotifications.includes(n._id))
      );
      setSelectedNotifications([]);
      showToast.success('Selected notifications deleted');
    } catch (error) {
      console.error('Error deleting notifications:', error);
      showToast.error('Failed to delete notifications');
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    // Apply type filter
    if (filters.type) {
      filtered = filterNotificationsByType(filtered, [filters.type]);
    }
    
    // Apply read status filter
    if (filters.showUnreadOnly) {
      filtered = filterNotificationsByReadStatus(filtered, true);
    }
    
    return sortNotifications(filtered);
  };

  const filteredNotifications = getFilteredNotifications();
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const notificationTypes = [
    { value: '', label: 'All Types' },
    { value: 'study_material', label: 'Study Materials' },
    { value: 'assignment', label: 'Assignments' },
    { value: 'assignment_submission', label: 'Assignment Submissions' },
    { value: 'test', label: 'Tests' },
    { value: 'notice', label: 'Notices' },
    { value: 'grade', label: 'Grades' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'paid_note', label: 'Paid Notes' },
    { value: 'system', label: 'System' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`mx-auto ${isMobile ? 'px-3 py-4' : 'max-w-4xl px-4 py-8'}`}>
        {/* Header */}
        <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
          <h1 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Notifications
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
            {getNotificationSummary(notifications)}
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        {isMobile && (
          <div className="mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4 touch-manipulation"
            >
              <span className="font-medium text-gray-900">Filters & Actions</span>
              <svg 
                className={`w-5 h-5 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Filters and Actions */}
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 mb-6 ${
          isMobile ? (showMobileFilters ? 'block' : 'hidden') : 'block'
        }`}>
          <div className={`${isMobile ? 'p-4 space-y-4' : 'p-4'}`}>
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} ${isMobile ? 'gap-4' : 'sm:items-center sm:justify-between gap-4'}`}>
              {/* Filters */}
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-4`}>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className={`border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation ${
                    isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'
                  }`}
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <label className={`flex items-center ${isMobile ? 'py-2' : ''}`}>
                  <input
                    type="checkbox"
                    checked={filters.showUnreadOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, showUnreadOnly: e.target.checked }))}
                    className={`mr-3 ${isMobile ? 'w-5 h-5' : 'mr-2'} touch-manipulation`}
                  />
                  <span className={`text-gray-700 ${isMobile ? 'text-base' : 'text-sm'}`}>
                    Show unread only
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className={`flex ${isMobile ? 'flex-col' : 'gap-2'} ${isMobile ? 'gap-3' : ''}`}>
                {selectedNotifications.length > 0 && (
                  <>
                    <button
                      onClick={handleMarkSelectedAsRead}
                      className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 touch-manipulation ${
                        isMobile ? 'px-4 py-3 text-base font-medium' : 'px-3 py-2 text-sm'
                      }`}
                    >
                      Mark Read ({selectedNotifications.length})
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className={`bg-red-600 text-white rounded-md hover:bg-red-700 touch-manipulation ${
                        isMobile ? 'px-4 py-3 text-base font-medium' : 'px-3 py-2 text-sm'
                      }`}
                    >
                      Delete ({selectedNotifications.length})
                    </button>
                  </>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className={`bg-green-600 text-white rounded-md hover:bg-green-700 touch-manipulation ${
                      isMobile ? 'px-4 py-3 text-base font-medium' : 'px-3 py-2 text-sm'
                    }`}
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={handleSelectAll}
                  className={`border border-gray-300 rounded-md hover:bg-gray-50 touch-manipulation ${
                    isMobile ? 'px-4 py-3 text-base font-medium' : 'px-3 py-2 text-sm'
                  }`}
                >
                  {filteredNotifications.every(n => selectedNotifications.includes(n._id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {loading && currentPage === 1 ? (
          <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`text-gray-500 mt-4 ${isMobile ? 'text-sm' : ''}`}>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
            <div className={`mb-4 ${isMobile ? 'text-4xl' : 'text-6xl'}`}>🔔</div>
            <h3 className={`font-medium text-gray-900 mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
              No notifications found
            </h3>
            <p className={`text-gray-500 ${isMobile ? 'text-sm px-4' : ''}`}>
              {filters.showUnreadOnly || filters.type
                ? 'Try adjusting your filters to see more notifications.'
                : 'You\'re all caught up! New notifications will appear here.'}
            </p>
          </div>
        ) : (
          <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
            {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
              <div key={date}>
                <h3 className={`font-medium text-gray-500 mb-3 ${isMobile ? 'text-sm px-2' : 'text-sm'}`}>
                  {date}
                </h3>
                <div className={`${isMobile ? 'space-y-3' : 'space-y-2'}`}>
                  {dateNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`relative overflow-hidden transition-all duration-300 touch-manipulation ${
                        isMobile 
                          ? `bg-white rounded-2xl shadow-md hover:shadow-lg border-0 ${
                              !notification.isRead 
                                ? 'ring-2 ring-blue-100 bg-gradient-to-r from-blue-50 to-white' 
                                : 'hover:shadow-xl'
                            }`
                          : `bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md ${
                              getNotificationBorderColor(notification.priority)
                            } ${!notification.isRead ? 'bg-blue-50' : ''}`
                      }`}
                    >
                      {/* Mobile Priority Indicator */}
                      {isMobile && (
                        <div className={`absolute top-0 left-0 w-full h-1 ${
                          notification.priority === 'high' ? 'bg-red-500' :
                          notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                      )}

                      <div className={`${isMobile ? 'p-4' : 'p-4'}`}>
                        {isMobile ? (
                          /* Mobile Compact Layout for Narrow Screens */
                          <div className="space-y-3">
                            {/* Header with Checkbox and Icon */}
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedNotifications.includes(notification._id)}
                                onChange={() => handleSelectNotification(notification._id)}
                                className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-1 touch-manipulation mt-0.5 flex-shrink-0"
                              />
                              
                              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                getNotificationColor(notification.priority)
                              }`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <h3 className={`font-semibold text-sm leading-tight pr-2 ${
                                    !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                    {notification.title}
                                  </h3>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                    {getNotificationTypeDisplay(notification.type)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatNotificationTime(notification.createdAt)}
                                  </span>
                                  {!notification.isRead && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                      New
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Message */}
                            <div className="pl-14">
                              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                                {notification.message}
                              </p>
                              
                              <button
                                onClick={() => handleNotificationClick(notification)}
                                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors touch-manipulation"
                              >
                                View Details
                                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Desktop Layout (unchanged) */
                          <div className="flex items-start space-x-3">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={selectedNotifications.includes(notification._id)}
                              onChange={() => handleSelectNotification(notification._id)}
                              className="mt-1"
                            />

                            {/* Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                              getNotificationColor(notification.priority)
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h4 className={`text-sm font-medium ${
                                    !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">
                                  {formatNotificationTime(notification.createdAt)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {getNotificationTypeDisplay(notification.type)}
                                </span>
                                <button
                                  onClick={() => handleNotificationClick(notification)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  View →
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className={`text-center ${isMobile ? 'py-4' : 'py-6'}`}>
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 touch-manipulation ${
                    isMobile ? 'px-8 py-3 text-base font-medium w-full max-w-xs' : 'px-6 py-2'
                  }`}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
