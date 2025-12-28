import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import { Plus, Grid, List, RefreshCw, AlertCircle } from 'lucide-react';
import SmartHeader from '../components/SmartHeader';
import { Button, Card } from '../components/ui';

// Import new components
import NoticeFilters from '../components/notices/NoticeFilters';
import NoticeCard from '../components/notices/NoticeCard';
import NoticeForm from '../components/notices/NoticeForm';
import NoticeSkeleton from '../components/notices/NoticeSkeleton';

const Noticeboard = () => {
  const { user } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // View states
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  
  // Constants
  const categories = ['general', 'academic', 'events', 'event', 'exam', 'holiday', 'maintenance', 'urgent'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const visibilityOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'students', label: 'Students Only' },
    { value: 'public', label: 'Public Only' }
  ];

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // If user is authenticated, get all notices, otherwise get public notices
      const endpoint = user ? '/notices/active' : '/notices/public';
      const response = await axiosInstance.get(endpoint);
      
      // Sort notices by timestamp in descending order (latest first)
      const sortedNotices = (response.data.notices || []).sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      setNotices(sortedNotices);
    } catch (error) {
      toast.error('Failed to fetch notices');
      console.error('Fetch notices error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateSubmit = async (formDataToSend) => {
    try {
      await axiosInstance.post('/notices', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Notice created successfully');
      setShowCreateForm(false);
      fetchNotices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create notice');
      throw error;
    }
  };

  const handleEditSubmit = async (formDataToSend) => {
    try {
      await axiosInstance.put(`/notices/${editingNotice._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Notice updated successfully');
      setShowEditForm(false);
      setEditingNotice(null);
      fetchNotices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update notice');
      throw error;
    }
  };

  const handleDownload = async (noticeId, noticeTitle) => {
    try {
      const response = await axiosInstance.get(`/notices/${noticeId}/download`, {
        responseType: 'blob'
      });
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `notice-${noticeTitle || noticeId}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        // If no content-disposition header, try to determine file type from content-type
        const contentType = response.headers['content-type'];
        let extension = '';
        
        if (contentType) {
          switch (contentType) {
            case 'application/pdf':
              extension = '.pdf';
              break;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
              extension = '.docx';
              break;
            case 'application/msword':
              extension = '.doc';
              break;
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
              extension = '.xlsx';
              break;
            case 'application/vnd.ms-excel':
              extension = '.xls';
              break;
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
              extension = '.pptx';
              break;
            case 'application/vnd.ms-powerpoint':
              extension = '.ppt';
              break;
            case 'image/jpeg':
              extension = '.jpg';
              break;
            case 'image/png':
              extension = '.png';
              break;
            case 'application/zip':
              extension = '.zip';
              break;
            default:
              extension = '.pdf'; // fallback
          }
        }
        
        filename += extension;
      }
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Document not found or has been removed');
      } else {
        toast.error('Failed to download document');
      }
    }
  };

  const handleEditNotice = (notice) => {
    setEditingNotice(notice);
    setShowEditForm(true);
  };

  const handleDeleteNotice = async (noticeId) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await axiosInstance.delete(`/notices/${noticeId}`);
        toast.success('Notice deleted successfully');
        fetchNotices();
      } catch (error) {
        toast.error('Failed to delete notice');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchNotices();
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/notices/search?query=${encodeURIComponent(searchTerm)}`);
      let searchResults = response.data.notices || [];
      
      // If user is not authenticated, filter to only show public notices
      if (!user) {
        searchResults = searchResults.filter(notice => 
          notice.visibility === 'public' || notice.visibility === 'all'
        );
      }
      
      setNotices(searchResults);
    } catch (error) {
      toast.error('Failed to search notices');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (category) => {
    if (!category) {
      fetchNotices();
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/notices/category/${category}`);
      let categoryResults = response.data.notices || [];
      
      // If user is not authenticated, filter to only show public notices
      if (!user) {
        categoryResults = categoryResults.filter(notice => 
          notice.visibility === 'public' || notice.visibility === 'all'
        );
      }
      
      setNotices(categoryResults);
    } catch (error) {
      toast.error('Failed to filter notices');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    fetchNotices();
  };

  // Filter and sort notices locally
  const getFilteredAndSortedNotices = () => {
    let filtered = [...notices];

    // Apply priority filter
    if (selectedPriority) {
      filtered = filtered.filter(notice => notice.priority === selectedPriority);
    }

    // Sort notices
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'viewCount':
          aValue = a.viewCount || 0;
          bValue = b.viewCount || 0;
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        default: // timestamp
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredNotices = getFilteredAndSortedNotices();
  const isPublic = !user;
  const canCreateNotice = user?.role === 'Teacher' || user?.role === 'Admin';

  if (loading && notices.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800">
        <SmartHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NoticeSkeleton.Filters />
          <NoticeSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800">
      <SmartHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 dark:text-white mb-2">
              {isPublic ? 'Public Notices' : 'Noticeboard'}
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 text-lg">
              {isPublic 
                ? 'Stay informed with our latest public announcements and important updates.'
                : 'Stay updated with the latest announcements, events, and important information.'
              }
            </p>
          </div>
        </div>
        {/* Filters */}
        <NoticeFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onSearch={handleSearch}
          onClearFilters={handleClearFilters}
          categories={categories}
          priorities={priorities}
        />

        {/* Toolbar - Mobile Responsive */}
        <div className="mb-6 space-y-4">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Notice Count and Clear Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p className="text-secondary-600 dark:text-secondary-400 font-medium text-sm sm:text-base">
                {filteredNotices.length === 0 ? 'No notices found' : (
                  <>
                    <span className="text-primary-600 dark:text-primary-400 font-semibold">
                      {filteredNotices.length}
                    </span>
                    {' '}notice{filteredNotices.length !== 1 ? 's' : ''} found
                  </>
                )}
              </p>
              {(searchTerm || selectedCategory || selectedPriority) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-secondary-500 hover:text-secondary-700 self-start sm:self-auto"
                >
                  Clear filters
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNotices(true)}
                disabled={refreshing}
                className="text-secondary-600 hover:text-secondary-800 justify-center sm:justify-start"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="sm:inline">Refresh</span>
              </Button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-none flex-1 sm:flex-none ${viewMode === 'list' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20' : ''}`}
                >
                  <List className="h-4 w-4 sm:mr-0" />
                  <span className="ml-2 sm:hidden">List</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-none flex-1 sm:flex-none ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20' : ''}`}
                >
                  <Grid className="h-4 w-4 sm:mr-0" />
                  <span className="ml-2 sm:hidden">Grid</span>
                </Button>
              </div>

              {/* Create Notice Button */}
              {canCreateNotice && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="shadow-lg hover:shadow-xl transition-all duration-300 justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Create Notice</span>
                  <span className="xs:hidden">Create</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Notices List/Grid */}
        {loading ? (
          <div className="space-y-6">
            <NoticeSkeleton count={3} />
          </div>
        ) : filteredNotices.length === 0 ? (
          <Card className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-secondary-400" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                No notices found
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                {searchTerm || selectedCategory || selectedPriority 
                  ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                  : 'No notices are available at the moment. Check back later for updates.'
                }
              </p>
              {(searchTerm || selectedCategory || selectedPriority) && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="mx-auto"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-6'
          } animate-fade-in`}>
            {filteredNotices.map((notice, index) => (
              <div
                key={notice._id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <NoticeCard
                  notice={notice}
                  onDownload={handleDownload}
                  onEdit={handleEditNotice}
                  onDelete={handleDeleteNotice}
                  showActions={canCreateNotice && (
                    notice.author?._id === user?._id || 
                    notice.author === user?._id
                  )}
                  isPublic={isPublic}
                  user={user}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Notice Form */}
      <NoticeForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateSubmit}
        categories={categories}
        priorities={priorities}
        visibilityOptions={visibilityOptions}
      />

      {/* Edit Notice Form */}
      <NoticeForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setEditingNotice(null);
        }}
        onSubmit={handleEditSubmit}
        initialData={editingNotice}
        isEditing={true}
        categories={categories}
        priorities={priorities}
        visibilityOptions={visibilityOptions}
      />
    </div>
  );
};

export default Noticeboard;
