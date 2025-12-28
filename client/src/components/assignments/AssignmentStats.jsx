import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Star,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { Card } from '../ui';

const AssignmentStats = ({ assignments = [], userRole, mySubmissions = [] }) => {
  const calculateStats = () => {
    if (userRole === 'Student') {
      const now = new Date();
      const pending = assignments.filter(a => {
        const hasSubmitted = mySubmissions.some(sub => sub.assignment._id === a._id);
        return !hasSubmitted && new Date(a.dueDate) > now;
      }).length;
      
      const submitted = mySubmissions.length;
      
      const overdue = assignments.filter(a => {
        const hasSubmitted = mySubmissions.some(sub => sub.assignment._id === a._id);
        return !hasSubmitted && new Date(a.dueDate) <= now;
      }).length;
      
      const graded = mySubmissions.filter(sub => sub.submission.isGraded).length;
      
      const averageGrade = graded > 0 
        ? mySubmissions
            .filter(sub => sub.submission.isGraded)
            .reduce((sum, sub) => sum + (sub.submission.grade / sub.assignment.maxMarks) * 100, 0) / graded
        : 0;

      return {
        total: assignments.length,
        pending,
        submitted,
        overdue,
        graded,
        averageGrade: Math.round(averageGrade)
      };
    } else {
      // Teacher/Admin stats
      const totalSubmissions = assignments.reduce((sum, a) => sum + (a.submissionCount || 0), 0);
      const needGrading = assignments.reduce((sum, a) => {
        return sum + (a.submissions?.filter(sub => !sub.isGraded).length || 0);
      }, 0);
      
      const activeAssignments = assignments.filter(a => a.status === 'active').length;
      
      return {
        total: assignments.length,
        active: activeAssignments,
        totalSubmissions,
        needGrading,
        averageSubmissions: assignments.length > 0 ? Math.round(totalSubmissions / assignments.length) : 0
      };
    }
  };

  const stats = calculateStats();

  const studentStats = [
    {
      label: 'Total Assignments',
      value: stats.total,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-warning-500',
      bgColor: 'bg-warning-50 dark:bg-warning-900/20',
      textColor: 'text-warning-700 dark:text-warning-300'
    },
    {
      label: 'Submitted',
      value: stats.submitted,
      icon: CheckCircle,
      color: 'bg-success-500',
      bgColor: 'bg-success-50 dark:bg-success-900/20',
      textColor: 'text-success-700 dark:text-success-300'
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'bg-error-500',
      bgColor: 'bg-error-50 dark:bg-error-900/20',
      textColor: 'text-error-700 dark:text-error-300'
    },
    {
      label: 'Average Grade',
      value: `${stats.averageGrade}%`,
      icon: Award,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300'
    }
  ];

  const teacherStats = [
    {
      label: 'Total Assignments',
      value: stats.total,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    {
      label: 'Active',
      value: stats.active,
      icon: CheckCircle,
      color: 'bg-success-500',
      bgColor: 'bg-success-50 dark:bg-success-900/20',
      textColor: 'text-success-700 dark:text-success-300'
    },
    {
      label: 'Total Submissions',
      value: stats.totalSubmissions,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300'
    },
    {
      label: 'Need Grading',
      value: stats.needGrading,
      icon: Clock,
      color: 'bg-warning-500',
      bgColor: 'bg-warning-50 dark:bg-warning-900/20',
      textColor: 'text-warning-700 dark:text-warning-300'
    },
    {
      label: 'Avg Submissions',
      value: stats.averageSubmissions,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-700 dark:text-indigo-300'
    }
  ];

  const statsToShow = userRole === 'Student' ? studentStats : teacherStats;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {statsToShow.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Card 
            key={stat.label} 
            className={`${stat.bgColor} border-0 p-3 sm:p-4 transition-all duration-300 hover:scale-105 hover:shadow-medium`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 text-white`} style={{ filter: 'drop-shadow(0 0 0 currentColor)' }} />
              </div>
              {userRole === 'Student' && stat.label === 'Average Grade' && stats.averageGrade > 0 && (
                <div className="flex items-center">
                  {stats.averageGrade >= 90 && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                  {stats.averageGrade >= 80 && stats.averageGrade < 90 && <Star className="h-3 w-3 text-blue-500 fill-current" />}
                  {stats.averageGrade >= 70 && stats.averageGrade < 80 && <Star className="h-3 w-3 text-green-500 fill-current" />}
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p className={`text-xl sm:text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm font-medium text-secondary-600 dark:text-secondary-400 leading-tight">
                {stat.label}
              </p>
            </div>

            {/* Progress indicator for certain stats */}
            {userRole === 'Student' && (
              <>
                {stat.label === 'Pending' && stats.total > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-1">
                      <div 
                        className="bg-warning-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {stat.label === 'Submitted' && stats.total > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-1">
                      <div 
                        className="bg-success-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${(stats.submitted / stats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {stat.label === 'Average Grade' && stats.averageGrade > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-500 ${
                          stats.averageGrade >= 90 ? 'bg-yellow-500' :
                          stats.averageGrade >= 80 ? 'bg-blue-500' :
                          stats.averageGrade >= 70 ? 'bg-green-500' :
                          stats.averageGrade >= 60 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${stats.averageGrade}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </>
            )}

            {userRole !== 'Student' && (
              <>
                {stat.label === 'Need Grading' && stats.totalSubmissions > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-1">
                      <div 
                        className="bg-warning-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${(stats.needGrading / stats.totalSubmissions) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default AssignmentStats;
