import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Card, Button, Badge, PageHeader } from '../components/ui';
import { activitiesApi } from '../api/activitiesApi';
import { dashboardApi } from '../api/dashboardApi';
import { toast } from '../utils/toast';

const Activities = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Activities' }
  ];

  useEffect(() => {
    fetchActivities();
  }, [user]);

  useEffect(() => {
    filterAndSortActivities();
  }, [activities, filterType, sortOrder]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      let data = [];
      
      // First try to get real activities from API
      if (user?.role === 'Teacher') {
        data = await activitiesApi.getTeacherActivities();
      } else if (user?.role === 'Student') {
        data = await activitiesApi.getStudentNotifications();
      }
      
      // If no real activities, generate from existing data
      if (data.length === 0) {
        console.log('No real activities found, generating from existing data...');
        const [assignments, tests, notices, studyMaterials] = await Promise.all([
          dashboardApi.getAssignments(user?.role),
          dashboardApi.getTests(user?.role),
          dashboardApi.getNotices(),
          dashboardApi.getStudyMaterials()
        ]);
        
        data = generateActivitiesFromData(assignments, tests, notices, studyMaterials);
      }
      
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const generateActivitiesFromData = (assignments, tests, notices, studyMaterials) => {
    const activities = [];
    const now = new Date();

    // Add assignments as activities
    assignments.forEach(assignment => {
      const createdDate = new Date(assignment.createdAt || assignment.dueDate);
      
      activities.push({
        _id: `assignment-${assignment._id}`,
        type: 'assignment',
        title: user?.role === 'Student' 
          ? `Assignment: ${assignment.title}` 
          : `Assignment created: ${assignment.title}`,
        description: assignment.description || `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
        createdAt: createdDate,
        timestamp: createdDate,
        userId: assignment.teacherId || assignment.createdBy,
        priority: new Date(assignment.dueDate) < new Date(Date.now() + 24*60*60*1000) ? 'high' : 'normal'
      });
    });

    // Add tests as activities
    tests.forEach(test => {
      const testDate = new Date(test.scheduledDate || test.createdAt);
      
      activities.push({
        _id: `test-${test._id}`,
        type: 'test',
        title: testDate > now 
          ? `Upcoming test: ${test.title}` 
          : `Test completed: ${test.title}`,
        description: test.description || `Duration: ${test.duration || 'N/A'} minutes`,
        createdAt: testDate,
        timestamp: testDate,
        userId: test.teacherId || test.createdBy,
        priority: testDate > now && testDate < new Date(Date.now() + 24*60*60*1000) ? 'high' : 'normal'
      });
    });

    // Add notices as activities
    notices.forEach(notice => {
      const noticeDate = new Date(notice.createdAt);
      
      activities.push({
        _id: `notice-${notice._id}`,
        type: 'notice',
        title: `Notice: ${notice.title}`,
        description: notice.content || notice.description,
        createdAt: noticeDate,
        timestamp: noticeDate,
        userId: notice.createdBy,
        priority: notice.priority || 'normal'
      });
    });

    // Add study materials as activities
    studyMaterials.forEach(material => {
      const materialDate = new Date(material.createdAt);
      
      activities.push({
        _id: `material-${material._id}`,
        type: 'material',
        title: `New material: ${material.title}`,
        description: material.description || `Subject: ${material.subject || 'General'}`,
        createdAt: materialDate,
        timestamp: materialDate,
        userId: material.uploadedBy || material.createdBy,
        priority: 'normal'
      });
    });

    // Sort by most recent
    return activities.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
  };

  const filterAndSortActivities = () => {
    let filtered = [...activities];

    // Apply filter
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt);
      const dateB = new Date(b.timestamp || b.createdAt);
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    setFilteredActivities(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getActivityIcon = (type) => {
    const icons = {
      assignment: '📝',
      test: '📋',
      material: '📚',
      notice: '📢',
      attendance: '📅',
      login: '🔐',
      submission: '✅',
      grade: '🎯',
      notification: '🔔',
      info: '📄'
    };
    return icons[type] || '📄';
  };

  const getActivityColor = (type) => {
    const colors = {
      assignment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      test: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      material: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      notice: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      attendance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      login: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      submission: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      grade: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      notification: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 7) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getUniqueTypes = () => {
    const types = [...new Set(activities.map(activity => activity.type))];
    return types.filter(type => type); // Remove any undefined/null types
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-4 sm:space-y-6 container-padding">
      <PageHeader
        title={user?.role === 'Teacher' ? 'Teacher Activities' : 'My Notifications'}
        subtitle={user?.role === 'Teacher' 
          ? 'View all activities from you and your students' 
          : 'View all your notifications and updates'
        }
        breadcrumbs={breadcrumbs}
      />

      {/* Mobile-Optimized Filters and Controls */}
      <Card>
        <Card.Body className="p-4 sm:p-6">
          {/* Mobile Filter Toggle */}
          <div className="flex items-center justify-between mb-4 sm:hidden">
            <h3 className="text-sm font-medium text-secondary-900 dark:text-white">
              Filters & Sort
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="btn-mobile"
            >
              {showMobileFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          {/* Desktop Filters (Always Visible) */}
          <div className="hidden sm:flex sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Filter by type:
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm min-h-[44px] touch-manipulation"
                >
                  <option value="all">All Types</option>
                  {getUniqueTypes().map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Sort by:
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm min-h-[44px] touch-manipulation"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              disabled={loading}
              className="btn-mobile"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {/* Mobile Filters (Collapsible) */}
          {showMobileFilters && (
            <div className="sm:hidden space-y-4 animate-slide-down">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 block">
                  Filter by type:
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm touch-manipulation"
                >
                  <option value="all">All Types</option>
                  {getUniqueTypes().map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 block">
                  Sort by:
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm touch-manipulation"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                onClick={fetchActivities}
                disabled={loading}
                className="w-full btn-mobile"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Mobile-Optimized Activities List */}
      <Card>
        <Card.Header className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white">
              {filterType === 'all' ? 'All Activities' : `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Activities`}
            </h2>
            <Badge variant="secondary" className="self-start sm:self-center">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-4 sm:p-6">
          {loading ? (
            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary-200 dark:bg-secondary-700 rounded-full animate-pulse flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 sm:h-4 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse"></div>
                    <div className="h-2 sm:h-3 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : currentItems.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {currentItems.map((activity, index) => (
                <div
                  key={activity._id || index}
                  className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors touch-manipulation"
                >
                  <div className="text-2xl sm:text-3xl flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-medium text-secondary-900 dark:text-white mb-1 line-clamp-2">
                          {activity.title || 'Activity'}
                        </h3>
                        {activity.description && (
                          <p className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-3">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-secondary-500 dark:text-secondary-400">
                          <span>{formatDate(activity.timestamp || activity.createdAt)}</span>
                          {activity.userId && (
                            <span className="hidden sm:inline">User ID: {String(activity.userId)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                          variant="secondary" 
                          className={`${getActivityColor(activity.type)} text-xs`}
                        >
                          {activity.type || 'info'}
                        </Badge>
                        {activity.priority === 'high' && (
                          <Badge variant="error" size="sm" className="text-xs">
                            High Priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📭</div>
              <h3 className="text-base sm:text-lg font-medium text-secondary-900 dark:text-white mb-2">
                No activities found
              </h3>
              <p className="text-sm sm:text-base text-secondary-500 dark:text-secondary-400">
                {filterType === 'all' 
                  ? 'There are no activities to display at the moment.' 
                  : `No ${filterType} activities found. Try changing the filter.`
                }
              </p>
            </div>
          )}
        </Card.Body>

        {/* Mobile-Optimized Pagination */}
        {totalPages > 1 && (
          <Card.Footer className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400 text-center sm:text-left">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredActivities.length)} of {filteredActivities.length} activities
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-mobile text-xs sm:text-sm"
                >
                  Previous
                </Button>
                
                {/* Page Numbers - Simplified for Mobile */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, totalPages) }, (_, i) => {
                    let pageNum;
                    const maxPages = window.innerWidth < 640 ? 3 : 5;
                    if (totalPages <= maxPages) {
                      pageNum = i + 1;
                    } else if (currentPage <= Math.floor(maxPages / 2) + 1) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - Math.floor(maxPages / 2)) {
                      pageNum = totalPages - maxPages + 1 + i;
                    } else {
                      pageNum = currentPage - Math.floor(maxPages / 2) + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "primary" : "outline"}
                        size="sm"
                        onClick={() => paginate(pageNum)}
                        className="w-8 h-8 sm:w-10 sm:h-10 p-0 text-xs sm:text-sm btn-mobile"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-mobile text-xs sm:text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>
    </div>
  );
};

export default Activities;
