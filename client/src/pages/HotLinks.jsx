import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const HotLinks = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    linktext: '',
    linkaddress: ''
  });

  useEffect(() => {
    // Only fetch data if auth is not loading and user exists
    if (!authLoading && user) {
      fetchLinks();
    }
  }, [user, authLoading]);

  const fetchLinks = async () => {
    try {
      const response = await axiosInstance.get('/hot-links');
      setLinks(response.data.links || []);
    } catch (error) {
      toast.error('Failed to fetch hot links');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate URL format
    if (!formData.linkaddress.startsWith('http://') && !formData.linkaddress.startsWith('https://')) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }

    try {
      if (editingLink) {
        await axiosInstance.put(`/hot-links/${editingLink._id}`, formData);
        toast.success('Link updated successfully');
      } else {
        await axiosInstance.post('/hot-links', formData);
        toast.success('Link added successfully');
      }
      
      setShowAddForm(false);
      setEditingLink(null);
      setFormData({ linktext: '', linkaddress: '' });
      fetchLinks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save link');
    }
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setFormData({
      linktext: link.linktext,
      linkaddress: link.linkaddress
    });
    setShowAddForm(true);
  };

  const handleDelete = async (linkId) => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      try {
        await axiosInstance.delete(`/hot-links/${linkId}`);
        toast.success('Link deleted successfully');
        fetchLinks();
      } catch (error) {
        toast.error('Failed to delete link');
      }
    }
  };

  const resetForm = () => {
    setFormData({ linktext: '', linkaddress: '' });
    setEditingLink(null);
    setShowAddForm(false);
  };

  const openLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getLinkIcon = (url) => {
    const domain = url.toLowerCase();
    if (domain.includes('google')) return '🔍';
    if (domain.includes('youtube')) return '📺';
    if (domain.includes('github')) return '💻';
    if (domain.includes('linkedin')) return '💼';
    if (domain.includes('facebook')) return '📘';
    if (domain.includes('twitter')) return '🐦';
    if (domain.includes('instagram')) return '📷';
    if (domain.includes('wikipedia')) return '📖';
    if (domain.includes('stackoverflow')) return '❓';
    if (domain.includes('edu')) return '🎓';
    if (domain.includes('gov')) return '🏛️';
    return '🔗';
  };

  // Show loading spinner while auth is loading
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  // Show message if not authenticated
  if (!user) {
    return (
      <div className="container-padding py-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
            Authentication Required
          </h3>
          <p className="text-secondary-600 dark:text-secondary-400">
            Please log in to view important links.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800">
      {/* Mobile-optimized container with proper padding */}
      <div className="container-padding py-4 sm:py-6 lg:py-8">
        {/* Mobile-responsive header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl sm:text-3xl">🔗</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-900 dark:text-white">
                Important Links
              </h1>
              <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1">
                Quick access to important resources
              </p>
            </div>
          </div>
          
          {/* Mobile-optimized Add Link button */}
          {(user?.role === 'Teacher' || user?.role === 'Admin') && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary btn-mobile w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation"
            >
              <span className="text-lg mr-2">+</span>
              <span className="font-medium">Add Link</span>
            </button>
          )}
        </div>

        {/* Mobile-optimized info banner */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 dark:text-blue-300 text-sm">ℹ️</span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Important Links
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                Quick access to frequently used websites, resources, and important external links.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile-optimized modal form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 sm:p-6">
            <div className="bg-white dark:bg-secondary-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] sm:max-h-[80vh] overflow-hidden shadow-2xl animate-slide-up">
              {/* Mobile-optimized modal header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                <h2 className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white">
                  {editingLink ? 'Edit Link' : 'Add New Link'}
                </h2>
                <button
                  onClick={resetForm}
                  className="w-8 h-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-colors touch-manipulation"
                >
                  <span className="text-secondary-600 dark:text-secondary-300">✕</span>
                </button>
              </div>
              
              {/* Mobile-optimized form */}
              <div className="p-4 sm:p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Link Text
                    </label>
                    <input
                      type="text"
                      name="linktext"
                      value={formData.linktext}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., University Portal, Google Scholar"
                      className="input w-full text-base sm:text-sm min-h-[44px] touch-manipulation"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Link Address
                    </label>
                    <input
                      type="url"
                      name="linkaddress"
                      value={formData.linkaddress}
                      onChange={handleInputChange}
                      required
                      placeholder="https://example.com"
                      className="input w-full text-base sm:text-sm min-h-[44px] touch-manipulation"
                    />
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
                      Must start with http:// or https://
                    </p>
                  </div>

                  {/* Mobile-optimized form buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-secondary btn-mobile w-full sm:flex-1 order-2 sm:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary btn-mobile w-full sm:flex-1 order-1 sm:order-2"
                    >
                      {editingLink ? 'Update' : 'Add'} Link
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-optimized links grid */}
        <div className="mb-8 sm:mb-12">
          {links.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-20 h-20 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔗</span>
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                No important links found
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 max-w-md mx-auto">
                {(user?.role === 'Teacher' || user?.role === 'Admin') 
                  ? 'Start by adding your first important link to help users access important resources quickly.'
                  : 'Important links will appear here once they are added by administrators.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {links.map((link, index) => (
                <div 
                  key={link._id} 
                  className="card card-hover animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="card-body p-4 sm:p-6">
                    {/* Mobile-optimized link header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{getLinkIcon(link.linkaddress)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-secondary-900 dark:text-white text-base sm:text-lg line-clamp-2 mb-1">
                          {link.linktext}
                        </h3>
                        <p className="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400 line-clamp-1">
                          {link.linkaddress.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </p>
                      </div>
                    </div>

                    {/* Mobile-optimized action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => openLink(link.linkaddress)}
                        className="btn-primary btn-mobile flex-1 text-sm font-medium"
                      >
                        <span className="mr-2">🔗</span>
                        Open Link
                      </button>
                      
                      {(user?.role === 'Admin' || user?.role === 'Teacher') && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(link)}
                            className="btn-warning btn-mobile w-12 h-12 p-0 flex items-center justify-center"
                            title="Edit Link"
                          >
                            <span className="text-base">✏️</span>
                          </button>
                          <button
                            onClick={() => handleDelete(link._id)}
                            className="btn-error btn-mobile w-12 h-12 p-0 flex items-center justify-center"
                            title="Delete Link"
                          >
                            <span className="text-base">🗑️</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile-optimized suggested links section */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-800 dark:to-purple-800 rounded-lg flex items-center justify-center">
                <span className="text-sm">💡</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white">
                Suggested Important Links
              </h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
              {[
                { text: 'Google Scholar', url: 'https://scholar.google.com', icon: '🎓' },
                { text: 'Wikipedia', url: 'https://wikipedia.org', icon: '📖' },
                { text: 'Khan Academy', url: 'https://khanacademy.org', icon: '📚' },
                { text: 'Coursera', url: 'https://coursera.org', icon: '💻' },
                { text: 'edX', url: 'https://edx.org', icon: '🎯' },
                { text: 'MIT OCW', url: 'https://ocw.mit.edu', icon: '🏛️' },
                { text: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '❓' },
                { text: 'GitHub', url: 'https://github.com', icon: '💻' }
              ].map((suggestedLink, index) => (
                <button
                  key={index}
                  onClick={() => openLink(suggestedLink.url)}
                  className="group p-3 sm:p-4 bg-secondary-50 dark:bg-secondary-800 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-xl text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 touch-manipulation min-h-[80px] sm:min-h-[90px] flex flex-col items-center justify-center"
                >
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                    {suggestedLink.icon}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-secondary-700 dark:text-secondary-300 line-clamp-2 leading-tight">
                    {suggestedLink.text}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotLinks;
