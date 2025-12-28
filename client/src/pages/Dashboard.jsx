import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Card, Button, Badge, PageHeader } from '../components/ui';
import { dashboardApi } from '../api/dashboardApi';
import { toast } from '../utils/toast';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    recentActivities: [],
    assignments: [],
    tests: [],
    notices: [],
    studyMaterials: []
  });

  const breadcrumbs = [];

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data based on user role
      const promises = [
        dashboardApi.getAssignments(user?.role),
        dashboardApi.getTests(user?.role),
        dashboardApi.getNotices(),
        dashboardApi.getStudyMaterials()
      ];

      // Add role-specific data
      if (user?.role === 'Student') {
        promises.push(dashboardApi.getStudentPerformance());
        promises.push(dashboardApi.getStudentNotifications());
      } else if (user?.role === 'Teacher') {
        promises.push(dashboardApi.getTeacherActivities());
      }

      const results = await Promise.allSettled(promises);

      // Process assignments data and ensure they are arrays
      const assignmentsData = results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value : [];
      const testsData = results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value : [];
      const noticesData = results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value : [];
      const studyMaterialsData = results[3].status === 'fulfilled' && Array.isArray(results[3].value) ? results[3].value : [];
      
      let performanceData = null;
      let activitiesData = [];
      let notificationsData = [];

      if (user?.role === 'Student') {
        performanceData = results[4]?.status === 'fulfilled' ? results[4].value : null;
        notificationsData = results[5]?.status === 'fulfilled' && Array.isArray(results[5].value) ? results[5].value : [];
      } else if (user?.role === 'Teacher') {
        activitiesData = results[4]?.status === 'fulfilled' && Array.isArray(results[4].value) ? results[4].value : [];
      }

      // Calculate stats based on real data
      const stats = calculateStats(assignmentsData, testsData, studyMaterialsData, performanceData);
      
      // Prioritize real-time activities from API, fallback to generated activities only if API fails
      let recentActivities = [];
      
      if (user?.role === 'Teacher') {
        // For teachers, always try to get real activities from API first
        if (activitiesData.length > 0) {
          recentActivities = formatActivitiesForDisplay(activitiesData);
        } else {
          // Only fallback to generated activities if no real activities available
          recentActivities = generateRecentActivities(assignmentsData, testsData, noticesData, studyMaterialsData);
        }
      } else if (user?.role === 'Student') {
        // For students, always try to get real notifications from API first
        if (notificationsData.length > 0) {
          recentActivities = formatNotificationsForDisplay(notificationsData);
        } else {
          // Only fallback to generated activities if no real notifications available
          recentActivities = generateRecentActivities(assignmentsData, testsData, noticesData, studyMaterialsData);
        }
      } else {
        // For other roles (Admin), generate from available data
        recentActivities = generateRecentActivities(assignmentsData, testsData, noticesData, studyMaterialsData);
      }

      setDashboardData({
        stats,
        recentActivities,
        assignments: assignmentsData,
        tests: testsData,
        notices: noticesData,
        studyMaterials: studyMaterialsData,
        performance: performanceData,
        activities: activitiesData,
        notifications: notificationsData
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Fallback to default data if API fails
      setDashboardData({
        stats: getDefaultStats(),
        recentActivities: getDefaultActivities(),
        assignments: [],
        tests: [],
        notices: [],
        studyMaterials: [],
        performance: null,
        activities: [],
        notifications: []
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (assignments, tests, studyMaterials, performance) => {
    const now = new Date();
    
    if (user?.role === 'Student') {
      // Student-specific stats
      // Fix: Use hasSubmitted and studentSubmission properties instead of non-existent status field
      const completedAssignments = assignments.filter(a => a.hasSubmitted === true).length;
      const pendingAssignments = assignments.filter(a => a.hasSubmitted === false || a.hasSubmitted === undefined).length;
      
      // For students, show available tests (active tests they can take)
      // The tests array from API already filters out completed tests for students
      const availableTests = tests.filter(t => t.isActive).length;
      
      // Use performance data for test statistics
      const totalCompletedTests = performance?.overall?.totalTests || 0;
      const averagePercentage = performance?.overall?.averagePercentage || 0;

      return [
        {
          label: 'Pending Assignments',
          value: pendingAssignments.toString(),
          change: completedAssignments > 0 ? `${completedAssignments} submitted` : 'No submissions yet',
          trend: pendingAssignments === 0 ? 'up' : 'stable'
        },
        {
          label: 'Online Test Average',
          value: totalCompletedTests > 0 ? `${Math.round(averagePercentage)}%` : 'No online tests',
          change: totalCompletedTests > 0 ? `${totalCompletedTests} completed` : 'No online tests taken',
          trend: averagePercentage >= 75 ? 'up' : averagePercentage >= 60 ? 'stable' : 'down'
        },
        {
          label: 'Available Tests',
          value: availableTests.toString(),
          change: availableTests > 0 ? 'Ready to take!' : 'No online tests available',
          trend: 'stable'
        },
        {
          label: 'Study Materials',
          value: studyMaterials.length.toString(),
          change: 'Available resources',
          trend: 'up'
        }
      ];
    } else if (user?.role === 'Teacher') {
      // Teacher-specific stats
      const totalAssignments = assignments.length;
      const totalTests = tests.length;
      
      // Calculate pending grading from submissions
      let pendingGrading = 0;
      assignments.forEach(assignment => {
        if (assignment.submissions && assignment.submissions.length > 0) {
          pendingGrading += assignment.submissions.filter(sub => !sub.isGraded).length;
        }
      });
      
      const activeTests = tests.filter(t => !t.dueDate || new Date(t.dueDate) > now).length;

      return [
        {
          label: 'Total Assignments',
          value: totalAssignments.toString(),
          change: pendingGrading > 0 ? `${pendingGrading} to grade` : 'All graded',
          trend: 'stable'
        },
        {
          label: 'Total Tests',
          value: totalTests.toString(),
          change: activeTests > 0 ? `${activeTests} active` : 'No active online tests',
          trend: 'stable'
        },
        {
          label: 'Study Materials',
          value: studyMaterials.length.toString(),
          change: 'Resources created',
          trend: 'up'
        },
        {
          label: 'Pending Reviews',
          value: pendingGrading.toString(),
          change: 'Need attention',
          trend: pendingGrading > 0 ? 'down' : 'up'
        }
      ];
    } else {
      // Admin stats
      return [
        {
          label: 'Total Assignments',
          value: assignments.length.toString(),
          change: 'System wide',
          trend: 'stable'
        },
        {
        label: 'Total Online Tests',
        value: tests.length.toString(),
          change: 'System wide',
          trend: 'stable'
        },
        {
          label: 'Study Materials',
          value: studyMaterials.length.toString(),
          change: 'Available resources',
          trend: 'up'
        },
        {
          label: 'Active Notices',
          value: dashboardData.notices.length.toString(),
          change: 'Published',
          trend: 'stable'
        }
      ];
    }
  };

  const generateRecentActivities = (assignments, tests, notices, studyMaterials) => {
    const activities = [];
    const now = new Date();

    // Add only 1 recent assignment
    assignments.slice(0, 1).forEach(assignment => {
      const createdDate = new Date(assignment.createdAt || assignment.dueDate);
      const timeAgo = getTimeAgo(createdDate);
      
      activities.push({
        type: 'assignment',
        title: user?.role === 'Student' 
          ? `Assignment: ${assignment.title}` 
          : `Assignment created: ${assignment.title}`,
        time: timeAgo,
        status: assignment.status || 'pending',
        id: assignment._id
      });
    });

    // Add only 1 recent test
    tests.slice(0, 1).forEach(test => {
      const testDate = new Date(test.scheduledDate || test.createdAt);
      const timeAgo = getTimeAgo(testDate);
      
      activities.push({
        type: 'test',
        title: testDate > now
          ? `Upcoming online test: ${test.title}`
          : `Online test completed: ${test.title}`,
        time: timeAgo,
        status: testDate > now ? 'upcoming' : 'completed',
        id: test._id
      });
    });

    // Add only 1 recent notice
    notices.slice(0, 1).forEach(notice => {
      const noticeDate = new Date(notice.createdAt);
      const timeAgo = getTimeAgo(noticeDate);
      
      activities.push({
        type: 'notice',
        title: `Notice: ${notice.title}`,
        time: timeAgo,
        status: 'info',
        id: notice._id
      });
    });

    // Sort by most recent and return top 3
    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 3);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Format activities from API for display (limit to 3-4 latest)
  const formatActivitiesForDisplay = (activities) => {
    return activities.slice(0, 3).map(activity => ({
      type: activity.type || 'info',
      title: activity.title || 'Activity',
      time: getTimeAgo(new Date(activity.timestamp || activity.createdAt)),
      status: getActivityStatus(activity.type),
      id: activity._id
    }));
  };

  // Format notifications from API for display (limit to 3-4 latest)
  const formatNotificationsForDisplay = (notifications) => {
    return notifications.slice(0, 3).map(notification => ({
      type: notification.type || 'info',
      title: notification.title || 'Notification',
      time: getTimeAgo(new Date(notification.createdAt)),
      status: notification.priority === 'high' ? 'urgent' : 'info',
      id: notification._id
    }));
  };

  // Get activity status based on type
  const getActivityStatus = (type) => {
    const statusMap = {
      assignment: 'pending',
      test: 'upcoming',
      notice: 'info',
      material: 'new',
      attendance: 'completed',
      login: 'info',
      submission: 'completed',
      grade: 'success'
    };
    return statusMap[type] || 'info';
  };

  const getDefaultStats = () => [
    {
      label: 'Loading...',
      value: '0',
      change: 'Please wait',
      trend: 'stable'
    }
  ];

  const getDefaultActivities = () => [
    {
      type: 'info',
      title: 'Loading dashboard data...',
      time: 'Just now',
      status: 'info'
    }
  ];

  // Dynamic quick actions based on real data
  const getQuickActions = () => {
    // Fix: Use hasSubmitted property instead of non-existent status field
    const pendingAssignments = dashboardData.assignments.filter(a => 
      a.hasSubmitted === false || a.hasSubmitted === undefined
    ).length;
    
    // For students, show available tests; for teachers, show active tests
    const availableTests = dashboardData.tests.filter(t => t.isActive).length;
    const activeTests = dashboardData.tests.filter(t => 
      !t.dueDate || new Date(t.dueDate) > new Date()
    ).length;

    return [
      {
        title: 'Assignments',
        description: user?.role === 'Student' ? 'View and submit assignments' : 'Manage assignments',
        icon: '📝',
        href: '/assignments',
        color: 'bg-blue-500',
        count: user?.role === 'Student' 
          ? `${pendingAssignments} pending` 
          : `${dashboardData.assignments.length} total`
      },
      {
        title: 'Online Tests',
        description: user?.role === 'Student' ? 'Take online tests and view results' : 'Manage online tests',
        icon: '📋',
        href: '/tests',
        color: 'bg-green-500',
        count: user?.role === 'Student' 
          ? `${availableTests} available`
          : `${dashboardData.tests.length} total`
      },
      {
        title: 'Study Materials',
        description: 'Access learning resources',
        icon: '📚',
        href: '/study-materials',
        color: 'bg-purple-500',
        count: `${dashboardData.studyMaterials.length} available`
      },
      {
        title: 'Attendance',
        description: user?.role === 'Student' ? 'View attendance analytics' : 'Mark attendance',
        icon: '📅',
        href: '/attendance',
        color: 'bg-orange-500',
        count: user?.role === 'Student' ? 'View analytics' : 'Manage'
      }
    ];
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      upcoming: 'warning',
      new: 'primary',
      info: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  const getActivityIcon = (type) => {
    const icons = {
      assignment: '📝',
      test: '📋',
      material: '📚',
      notice: '📢'
    };
    return icons[type] || '📄';
  };

  return (
    <div className="space-y-4 sm:space-y-6 container-padding">
      <PageHeader
        title={`Welcome back, ${user?.fullname || user?.name || 'User'}!`}
        subtitle="Here's what's happening with your academic journey today."
        breadcrumbs={breadcrumbs}
      />

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="text-center">
              <div className="space-y-2 p-4 sm:p-6">
                <div className="h-6 sm:h-8 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse"></div>
                <div className="h-2 sm:h-3 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Overview - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {dashboardData.stats.map((stat, index) => (
              <Card key={index} className="text-center touch-manipulation">
                <div className="space-y-2 p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-secondary-900 dark:text-white line-clamp-2">
                    {stat.label}
                  </div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400 line-clamp-1">
                    {stat.change}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Actions - Mobile Optimized */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white mb-3 sm:mb-4 px-1">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {getQuickActions().map((action, index) => (
                <Card key={index} hover className="group touch-manipulation">
                  <Link to={action.href} className="block p-4 sm:p-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${action.color} rounded-lg flex items-center justify-center text-white text-lg sm:text-xl group-hover:scale-110 transition-transform flex-shrink-0`}>
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-semibold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                          {action.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-2">
                          {action.description}
                        </p>
                        <Badge variant="secondary" size="sm" className="text-xs">
                          {action.count}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Links - Mobile Optimized */}
          <div>
            <Card>
              <Card.Header className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white">
                  Quick Links
                </h2>
              </Card.Header>
              <Card.Body className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                <Button variant="ghost" className="w-full justify-start btn-mobile touch-manipulation" asChild>
                  <Link to="/noticeboard">
                    <span className="text-sm sm:text-base">📢 Noticeboard</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start btn-mobile touch-manipulation" asChild>
                  <Link to="/paid-notes">
                    <span className="text-sm sm:text-base">💰 Paid Notes</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start btn-mobile touch-manipulation" asChild>
                  <Link to="/e-library">
                    <span className="text-sm sm:text-base">📖 E-Library</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start btn-mobile touch-manipulation" asChild>
                  <Link to="/previous-year-questions">
                    <span className="text-sm sm:text-base">📄 Previous Year Questions</span>
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start btn-mobile touch-manipulation" asChild>
                  <Link to="/image-gallery">
                    <span className="text-sm sm:text-base">🖼️ Image Gallery</span>
                  </Link>
                </Button>
                {user?.role === 'Student' && (
                  <>
                    <Button variant="ghost" className="w-full justify-start btn-mobile touch-manipulation" asChild>
                      <Link to="/academic-details">
                        <span className="text-sm sm:text-base">🎓 Academic Details</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start btn-mobile touch-manipulation" asChild>
                      <Link to="/change-password">
                        <span className="text-sm sm:text-base">🔒 Change Password</span>
                      </Link>
                    </Button>
                  </>
                )}
                {user?.role === 'Teacher' && (
                  <Button variant="ghost" className="w-full justify-start btn-mobile touch-manipulation" asChild>
                    <Link to="/teacher/paid-notes">
                      <span className="text-sm sm:text-base">📝 My Notes</span>
                    </Link>
                  </Button>
                )}
              </Card.Body>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
