import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadCount } from '../../api/notificationApi';
import { getBadgeCount } from '../../utils/notificationUtils';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch unread count on component mount and detect mobile
  useEffect(() => {
    fetchUnreadCount();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Detect mobile view
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Close dropdown when clicking outside (only for desktop)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isMobile && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, isMobile]);

  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleViewAllClick = () => {
    setShowDropdown(false);
    navigate('/notifications');
  };

  const handleNotificationUpdate = () => {
    // Refresh unread count when notifications are updated
    fetchUnreadCount();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={handleBellClick}
        className={`relative p-2 rounded-lg transition-colors duration-200 ${
          showDropdown
            ? 'bg-blue-100 text-blue-600'
            : 'text-blue-100 hover:text-white hover:bg-blue-700'
        }`}
        aria-label="Notifications"
        title="Notifications"
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge for unread count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {getBadgeCount(unreadCount)}
          </span>
        )}

        {/* Loading indicator */}
        {loading && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-3 w-3 animate-pulse"></span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <>
          {!isMobile && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <NotificationDropdown
                onViewAll={handleViewAllClick}
                onNotificationUpdate={handleNotificationUpdate}
                onClose={() => setShowDropdown(false)}
                isMobile={false}
              />
            </div>
          )}
          {isMobile && (
            <NotificationDropdown
              onViewAll={handleViewAllClick}
              onNotificationUpdate={handleNotificationUpdate}
              onClose={() => setShowDropdown(false)}
              isMobile={true}
            />
          )}
        </>
      )}
    </div>
  );
};

export default NotificationBell;
