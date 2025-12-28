import React from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Upload,
  GraduationCap,
  User,
  BookOpen,
  Star,
  TrendingUp
} from 'lucide-react';
import { Card, Button } from '../ui';

const AssignmentCard = ({ 
  assignment, 
  userRole, 
  onSubmit, 
  onEdit, 
  onDelete, 
  onViewSubmissions, 
  onDownload,
  getStudentSubmission,
  hasStudentSubmitted,
  isSubmissionDeadlinePassed 
}) => {
  const studentSubmission = getStudentSubmission(assignment);
  const hasSubmitted = hasStudentSubmitted(assignment);
  const deadlinePassed = isSubmissionDeadlinePassed(assignment.dueDate);
  
  const getStatusConfig = () => {
    if (userRole === 'Student') {
      if (hasSubmitted) {
        return {
          status: 'submitted',
          color: 'bg-success-100 text-success-800 border-success-200',
          icon: CheckCircle,
          label: 'Submitted'
        };
      } else if (deadlinePassed) {
        return {
          status: 'overdue',
          color: 'bg-error-100 text-error-800 border-error-200',
          icon: AlertCircle,
          label: 'Overdue'
        };
      } else {
        const dueDate = new Date(assignment.dueDate);
        const now = new Date();
        const hoursLeft = (dueDate - now) / (1000 * 60 * 60);
        
        if (hoursLeft <= 24) {
          return {
            status: 'urgent',
            color: 'bg-warning-100 text-warning-800 border-warning-200',
            icon: Clock,
            label: 'Due Soon'
          };
        } else {
          return {
            status: 'pending',
            color: 'bg-primary-100 text-primary-800 border-primary-200',
            icon: Clock,
            label: 'Pending'
          };
        }
      }
    } else {
      return {
        status: 'active',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: FileText,
        label: 'Active'
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getGradeColor = (grade, maxMarks) => {
    const percentage = (grade / maxMarks) * 100;
    if (percentage >= 90) return 'text-success-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-warning-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-error-600';
  };

  return (
    <Card 
      hover 
      className="group transition-all duration-300 hover:shadow-large hover:-translate-y-1 overflow-hidden"
    >
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 p-4 sm:p-6">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm bg-white/90 ${statusConfig.color}`}>
              <StatusIcon className="h-3 w-3" />
              <span className="hidden xs:inline">{statusConfig.label}</span>
            </span>
            
            {/* Quick Actions for Teachers */}
            {(userRole === 'Teacher' || userRole === 'Admin') && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(assignment)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 h-8 w-8"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(assignment)}
                  className="text-white/80 hover:text-white hover:bg-red-500/30 p-1.5 h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-white/90 transition-colors">
            {assignment.title}
          </h3>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-white/80 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate max-w-[120px]">{assignment.subject?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{formatDate(assignment.dueDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{assignment.maxMarks} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Description */}
        <p className="text-secondary-700 dark:text-secondary-300 text-sm leading-relaxed line-clamp-3">
          {assignment.description}
        </p>

        {/* Instructions */}
        {assignment.instructions && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
            <p className="text-blue-800 dark:text-blue-200 text-sm font-medium mb-1">Instructions:</p>
            <p className="text-blue-700 dark:text-blue-300 text-sm line-clamp-2">{assignment.instructions}</p>
          </div>
        )}

        {/* Attachments */}
        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Attachments ({assignment.attachments.length})
            </p>
            <div className="grid gap-2">
              {assignment.attachments.slice(0, 2).map((filename, index) => (
                <div key={index} className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg border">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-secondary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-secondary-700 dark:text-secondary-300 break-words flex-1 leading-relaxed">
                        {filename}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownload(filename)}
                      className="text-primary-600 hover:text-primary-700 border-primary-200 hover:border-primary-300 hover:bg-primary-50 px-2 sm:px-3 py-1 h-7 text-xs w-full sm:w-auto"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      <span className="hidden xs:inline">Download</span>
                      <span className="xs:hidden">Get</span>
                    </Button>
                  </div>
                </div>
              ))}
              {assignment.attachments.length > 2 && (
                <p className="text-xs text-secondary-500 px-2">+{assignment.attachments.length - 2} more files</p>
              )}
            </div>
          </div>
        )}

        {/* Student Submission Section */}
        {userRole === 'Student' && (
          <div className="space-y-3">
            {hasSubmitted ? (
              <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success-600" />
                    <span className="font-medium text-success-800 dark:text-success-200">Submitted</span>
                  </div>
                  <span className="text-xs text-success-600 dark:text-success-400">
                    {new Date(studentSubmission.submissionDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-success-700 dark:text-success-300">
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{studentSubmission.submissionFile}</span>
                  </div>
                  
                  {studentSubmission.isGraded && (
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-secondary-800 rounded-lg">
                      <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Grade:</span>
                      <span className={`text-lg font-bold ${getGradeColor(studentSubmission.grade, assignment.maxMarks)}`}>
                        {studentSubmission.grade}/{assignment.maxMarks}
                      </span>
                    </div>
                  )}
                  
                  {studentSubmission.feedback && (
                    <div className="p-3 bg-white dark:bg-secondary-800 rounded-lg">
                      <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Feedback:</p>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">{studentSubmission.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : deadlinePassed ? (
              <div className="p-4 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800 text-center">
                <AlertCircle className="h-8 w-8 text-error-500 mx-auto mb-2" />
                <p className="text-error-800 dark:text-error-200 font-medium">Submission deadline has passed</p>
              </div>
            ) : (
              <Button
                onClick={() => onSubmit(assignment)}
                className="w-full bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Submit Assignment
              </Button>
            )}
          </div>
        )}

        {/* Teacher Stats Section */}
        {(userRole === 'Teacher' || userRole === 'Admin') && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Submissions</span>
                </div>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {assignment.submissionCount || 0}
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">To Grade</span>
                </div>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {assignment.submissions?.filter(sub => !sub.isGraded).length || 0}
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => onViewSubmissions(assignment._id)}
              variant="outline"
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View All Submissions
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400 pt-3 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[120px]">
              {assignment.createdBy?.fullname || assignment.createdBy?.name || assignment.teacherId?.fullname || assignment.teacherId?.name || assignment.authorName || 'Unknown'}
            </span>
          </div>
          <span>
            Updated {new Date(assignment.updatedAt || assignment.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default AssignmentCard;
