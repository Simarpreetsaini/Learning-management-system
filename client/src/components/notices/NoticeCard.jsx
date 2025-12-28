import React from 'react';
import { Clock, Download, Eye, Calendar, Tag, User, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, Badge, Button } from '../ui';

const NoticeCard = ({ 
  notice, 
  onDownload, 
  onEdit, 
  onDelete, 
  showActions = false, 
  isPublic = false,
  user = null,
  className = '' 
}) => {
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          color: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200',
          icon: AlertCircle,
          pulse: true
        };
      case 'high':
        return {
          color: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
          icon: AlertTriangle,
          pulse: false
        };
      case 'medium':
        return {
          color: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
          icon: Info,
          pulse: false
        };
      case 'low':
        return {
          color: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
          icon: CheckCircle,
          pulse: false
        };
      default:
        return {
          color: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-200',
          icon: Info,
          pulse: false
        };
    }
  };

  const getCategoryConfig = (category) => {
    const configs = {
      urgent: { color: 'bg-error-50 text-error-700 border-error-200 dark:bg-error-900/20 dark:text-error-300', emoji: '🚨' },
      exam: { color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300', emoji: '📝' },
      event: { color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300', emoji: '🎉' },
      academic: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300', emoji: '🎓' },
      holiday: { color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300', emoji: '🏖️' },
      general: { color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300', emoji: '📢' }
    };
    return configs[category] || configs.general;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const priorityConfig = getPriorityConfig(notice.priority);
  const categoryConfig = getCategoryConfig(notice.category);
  const PriorityIcon = priorityConfig.icon;

  return (
    <Card 
      hover 
      className={`group transition-all duration-300 hover:shadow-large hover:-translate-y-1 ${
        isExpired(notice.expiryDate) ? 'opacity-75' : ''
      } ${className}`}
    >
      {/* Mobile-First Header */}
      <div className="space-y-3 mb-4">
        {/* Priority and Category Badges - Mobile Stacked */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${categoryConfig.color}`}>
            <span>{categoryConfig.emoji}</span>
            <span className="capitalize hidden xs:inline">{notice.category}</span>
          </span>
          
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color} ${
            priorityConfig.pulse ? 'animate-pulse' : ''
          }`}>
            <PriorityIcon className="h-3 w-3" />
            <span className="capitalize hidden xs:inline">{notice.priority}</span>
          </span>

          {isExpiringSoon(notice.expiryDate) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300 animate-pulse">
              <Clock className="h-3 w-3" />
              <span className="hidden xs:inline">Expiring Soon</span>
            </span>
          )}

          {isExpired(notice.expiryDate) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300">
              <AlertCircle className="h-3 w-3" />
              <span className="hidden xs:inline">Expired</span>
            </span>
          )}
        </div>

        {/* Title - Mobile Optimized */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 flex-1">
            {notice.title}
          </h3>

          {/* Mobile Action Menu */}
          {showActions && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(notice)}
                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 p-1 h-8 w-8"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(notice._id)}
                className="text-error-600 hover:text-error-700 hover:bg-error-50 p-1 h-8 w-8"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          )}
        </div>

        {/* Meta Info - Mobile Optimized */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-500 dark:text-secondary-400">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{notice.authorName || notice.author?.fullname || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(notice.timestamp)}</span>
          </div>
          {!isPublic && notice.viewCount !== undefined && user?.role !== 'Student' && (
            <div className="flex items-center gap-1 hidden sm:flex">
              <Eye className="h-3 w-3" />
              <span>{notice.viewCount} views</span>
            </div>
          )}
        </div>
      </div>

      {/* Content - Mobile Optimized */}
      <div className="mb-4">
        <p className="text-secondary-700 dark:text-secondary-300 text-sm leading-relaxed line-clamp-3">
          {notice.body}
        </p>
      </div>

      {/* Tags - Mobile Optimized */}
      {notice.tags && notice.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {notice.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 text-xs rounded-full"
            >
              <Tag className="h-2 w-2" />
              <span className="truncate max-w-[60px]">#{tag}</span>
            </span>
          ))}
          {notice.tags.length > 2 && (
            <span className="inline-flex items-center px-2 py-1 bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400 text-xs rounded-full">
              +{notice.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Expiry Warning - Mobile Optimized */}
      {notice.expiryDate && !isExpired(notice.expiryDate) && (
        <div className={`p-2 sm:p-3 rounded-lg border-l-4 mb-4 ${
          isExpiringSoon(notice.expiryDate) 
            ? 'bg-warning-50 border-warning-400 dark:bg-warning-900/20 dark:border-warning-500' 
            : 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-500'
        }`}>
          <p className={`text-xs sm:text-sm font-medium ${
            isExpiringSoon(notice.expiryDate)
              ? 'text-warning-800 dark:text-warning-200'
              : 'text-blue-800 dark:text-blue-200'
          }`}>
            <span className="flex items-center gap-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Expires on: </span>
              <span className="sm:hidden">Expires: </span>
              {new Date(notice.expiryDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: window.innerWidth < 640 ? undefined : 'numeric'
              })}
            </span>
          </p>
        </div>
      )}

      {/* Footer - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-secondary-200 dark:border-secondary-700">
        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-500 dark:text-secondary-400">
          {!isPublic && (
            <span className="capitalize hidden sm:inline">Visibility: {notice.visibility}</span>
          )}
          <span>
            Updated: {new Date(notice.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
          {!isPublic && notice.viewCount !== undefined && user?.role !== 'Student' && (
            <div className="flex items-center gap-1 sm:hidden">
              <Eye className="h-3 w-3" />
              <span>{notice.viewCount}</span>
            </div>
          )}
        </div>

        {/* Download Button - Mobile Optimized */}
        {notice.noticedocument && notice.noticedocument.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(notice._id, notice.title)}
            className="flex items-center justify-center gap-2 text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-300 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        )}
      </div>
    </Card>
  );
};

export default NoticeCard;
