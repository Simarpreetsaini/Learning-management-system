import React from 'react';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  BookOpen,
  Users,
  Target
} from 'lucide-react';
import { Button } from '../ui';

const AssignmentHero = ({ 
  userRole, 
  onCreateAssignment, 
  assignmentStats = {},
  userName 
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    if (userRole === 'Student') {
      if (assignmentStats.pending > 0) {
        return `You have ${assignmentStats.pending} assignment${assignmentStats.pending > 1 ? 's' : ''} pending. Let's get them done!`;
      } else if (assignmentStats.overdue > 0) {
        return `${assignmentStats.overdue} assignment${assignmentStats.overdue > 1 ? 's are' : ' is'} overdue. Time to catch up!`;
      } else if (assignmentStats.submitted > 0) {
        return `Great job! You've submitted ${assignmentStats.submitted} assignment${assignmentStats.submitted > 1 ? 's' : ''}.`;
      } else {
        return "You're all caught up! Check back for new assignments.";
      }
    } else {
      if (assignmentStats.needGrading > 0) {
        return `${assignmentStats.needGrading} submission${assignmentStats.needGrading > 1 ? 's' : ''} waiting for your review.`;
      } else if (assignmentStats.total > 0) {
        return `Managing ${assignmentStats.total} assignment${assignmentStats.total > 1 ? 's' : ''} across your courses.`;
      } else {
        return "Ready to create your first assignment?";
      }
    }
  };

  const getQuickStats = () => {
    if (userRole === 'Student') {
      return [
        { 
          label: 'Pending', 
          value: assignmentStats.pending || 0, 
          icon: Clock, 
          color: 'text-warning-600',
          bgColor: 'bg-warning-100 dark:bg-warning-900/20'
        },
        { 
          label: 'Submitted', 
          value: assignmentStats.submitted || 0, 
          icon: CheckCircle, 
          color: 'text-success-600',
          bgColor: 'bg-success-100 dark:bg-success-900/20'
        },
        { 
          label: 'Average', 
          value: `${assignmentStats.averageGrade || 0}%`, 
          icon: TrendingUp, 
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        }
      ];
    } else {
      return [
        { 
          label: 'Active', 
          value: assignmentStats.active || 0, 
          icon: FileText, 
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        },
        { 
          label: 'Submissions', 
          value: assignmentStats.totalSubmissions || 0, 
          icon: Users, 
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20'
        },
        { 
          label: 'To Grade', 
          value: assignmentStats.needGrading || 0, 
          icon: Clock, 
          color: 'text-warning-600',
          bgColor: 'bg-warning-100 dark:bg-warning-900/20'
        }
      ];
    }
  };

  const quickStats = getQuickStats();

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800"></div>
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      
      {/* Content */}
      <div className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-center">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  {getGreeting()}, {userName || 'there'}! 👋
                </h1>
                <p className="text-lg sm:text-xl text-white/90 font-medium">
                  {userRole === 'Student' ? 'Ready to tackle your assignments?' : 'Manage your assignments with ease'}
                </p>
                <p className="text-sm sm:text-base text-white/80 max-w-2xl">
                  {getMotivationalMessage()}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {(userRole === 'Teacher' || userRole === 'Admin') && (
                  <Button
                    onClick={onCreateAssignment}
                    className="bg-white text-primary-700 hover:bg-white/90 font-semibold px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-5 w-5" />
                    Create Assignment
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <Calendar className="h-5 w-5" />
                  View Calendar
                </Button>
                
                {userRole === 'Student' && (
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    <BookOpen className="h-5 w-5" />
                    Study Materials
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="lg:col-span-1">
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:gap-4">
                {quickStats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  
                  return (
                    <div
                      key={stat.label}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2 lg:mb-3">
                        <div className={`p-2 rounded-lg ${stat.bgColor} bg-opacity-20`}>
                          <IconComponent className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                        </div>
                        {userRole === 'Student' && stat.label === 'Average' && assignmentStats.averageGrade >= 90 && (
                          <div className="text-yellow-300">⭐</div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xl lg:text-2xl font-bold text-white">
                          {stat.value}
                        </p>
                        <p className="text-xs lg:text-sm font-medium text-white/80">
                          {stat.label}
                        </p>
                      </div>

                      {/* Mini progress bar for certain stats */}
                      {userRole === 'Student' && stat.label === 'Average' && assignmentStats.averageGrade > 0 && (
                        <div className="mt-2 lg:mt-3">
                          <div className="w-full bg-white/20 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full transition-all duration-500 ${
                                assignmentStats.averageGrade >= 90 ? 'bg-yellow-400' :
                                assignmentStats.averageGrade >= 80 ? 'bg-blue-400' :
                                assignmentStats.averageGrade >= 70 ? 'bg-green-400' :
                                assignmentStats.averageGrade >= 60 ? 'bg-orange-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${assignmentStats.averageGrade}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom section with additional info */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>
                    {userRole === 'Student' 
                      ? `${assignmentStats.total || 0} total assignments this semester`
                      : `${assignmentStats.total || 0} assignments created`
                    }
                  </span>
                </div>
              </div>
              
              <div className="text-xs">
                Last updated: {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentHero;
