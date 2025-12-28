import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { Clock, Download, Eye, Calendar, Tag, User, AlertCircle, Info, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, Button } from '../ui';
import { AuthContext } from '../../context/AuthContext';

const FeaturedNotices = () => {
  const { user } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedNotices();
  }, []);

  const fetchFeaturedNotices = async () => {
    try {
      const response = await axiosInstance.get('/notices/public');
      const sortedNotices = response.data.notices.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      // Get only the 3 most recent notices
      setNotices(sortedNotices.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          color: 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300',
          icon: AlertCircle,
          pulse: true
        };
      case 'high':
        return {
          color: 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300',
          icon: AlertTriangle,
          pulse: false
        };
      case 'medium':
        return {
          color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300',
          icon: Info,
          pulse: false
        };
      case 'low':
        return {
          color: 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300',
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-48 animate-pulse"></div>
          <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-20 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded-full w-16"></div>
                  <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded-full w-12"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-full"></div>
                  <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
                </div>
                <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-20"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-full"></div>
                  <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-5/6"></div>
                  <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-4/6"></div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-secondary-200 dark:border-secondary-700">
                  <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-16"></div>
                  <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-16"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display text-secondary-900 dark:text-white mb-2">
            Latest Notices
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400">
            Stay updated with the latest announcements and important information
          </p>
        </div>
        <Link
          to="/noticeboard"
          className="group inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-all duration-200 hover:gap-3"
        >
          View All
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      
      {notices.length === 0 ? (
        <Card className="text-center py-16">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
              No notices available
            </h3>
            <p className="text-secondary-500 dark:text-secondary-400 text-sm">
              Check back later for new announcements and updates.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.map((notice, index) => {
            const priorityConfig = getPriorityConfig(notice.priority);
            const categoryConfig = getCategoryConfig(notice.category);
            const PriorityIcon = priorityConfig.icon;

            return (
              <Card 
                key={notice._id} 
                hover 
                className={`group transition-all duration-300 hover:shadow-large hover:-translate-y-1 ${
                  isExpired(notice.expiryDate) ? 'opacity-75' : ''
                } animate-slide-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${categoryConfig.color}`}>
                      <span>{categoryConfig.emoji}</span>
                      <span className="capitalize">{notice.category}</span>
                    </span>
                    
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color} ${
                      priorityConfig.pulse ? 'animate-pulse' : ''
                    }`}>
                      <PriorityIcon className="h-3 w-3" />
                      <span className="capitalize">{notice.priority}</span>
                    </span>

                    {isExpiringSoon(notice.expiryDate) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300 animate-pulse">
                        <Clock className="h-3 w-3" />
                        Expiring Soon
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {notice.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-secondary-500 dark:text-secondary-400">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{notice.authorName || notice.author?.fullname || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(notice.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-secondary-700 dark:text-secondary-300 text-sm line-clamp-3 leading-relaxed">
                    {notice.body}
                  </p>

                  {/* Tags */}
                  {notice.tags && notice.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {notice.tags.slice(0, 2).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 text-xs rounded-full"
                        >
                          <Tag className="h-2 w-2" />
                          #{tag}
                        </span>
                      ))}
                      {notice.tags.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400 text-xs rounded-full">
                          +{notice.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expiry Warning */}
                  {notice.expiryDate && !isExpired(notice.expiryDate) && (
                    <div className={`p-2 rounded-lg border-l-4 text-xs ${
                      isExpiringSoon(notice.expiryDate) 
                        ? 'bg-warning-50 border-warning-400 text-warning-800 dark:bg-warning-900/20 dark:border-warning-500 dark:text-warning-200' 
                        : 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-200'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">
                          Expires: {new Date(notice.expiryDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-secondary-200 dark:border-secondary-700">
                    <div className="flex items-center gap-3 text-xs text-secondary-500 dark:text-secondary-400">
                      {notice.noticedocument && notice.noticedocument.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>Attachment</span>
                        </div>
                      )}
                      {(user?.role === 'Teacher' || user?.role === 'Admin') && notice.viewCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{notice.viewCount} views</span>
                        </div>
                      )}
                    </div>

                    {notice.noticedocument && notice.noticedocument.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="text-xs h-7 px-2"
                      >
                        <a
                          href={`/api/notices/${notice._id}/download`}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          <span className="hidden sm:inline">Download</span>
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FeaturedNotices;
