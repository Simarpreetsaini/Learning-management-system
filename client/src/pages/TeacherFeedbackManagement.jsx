import React, { useState, useEffect } from 'react';
import { getAllFeedback, respondToFeedback } from '../api/feedbackApi';
import { toast } from '../utils/toast';
import { Filter, X, MessageCircle, Clock, User, Phone, Mail, Search, ChevronDown, Send, AlertCircle } from 'lucide-react';

const TeacherFeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileModal, setShowMobileModal] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await getAllFeedback();
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to fetch feedback records');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (feedbackId) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      setIsResponding(true);
      await respondToFeedback(feedbackId, responseText);
      toast.success('Response sent successfully');
      
      // Update the feedback in the list
      setFeedbacks(prev => prev.map(feedback => 
        feedback._id === feedbackId 
          ? { ...feedback, adminResponse: responseText, status: 'resolved' }
          : feedback
      ));
      
      setSelectedFeedback(null);
      setResponseText('');
      setShowMobileModal(false);
    } catch (error) {
      console.error('Error responding to feedback:', error);
      toast.error('Failed to send response');
    } finally {
      setIsResponding(false);
    }
  };

  const openMobileModal = (feedback) => {
    setSelectedFeedback(feedback);
    setShowMobileModal(true);
    setResponseText('');
  };

  const closeMobileModal = () => {
    setSelectedFeedback(null);
    setShowMobileModal(false);
    setResponseText('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'course':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'platform':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'instructor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesFilter = filter === 'all' || feedback.status === filter;
    const matchesSearch = !searchTerm || 
      feedback.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.feedback.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 safe-top safe-bottom">
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-secondary-900 dark:text-white">
              Feedback Management
            </h1>
            <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-300 mt-1">
              View and respond to student and public feedback
            </p>
          </div>

          {/* Mobile Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white text-sm touch-manipulation"
              />
            </div>

            {/* Filter - Desktop */}
            <div className="hidden sm:flex items-center space-x-2">
              <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 whitespace-nowrap">
                Filter:
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white min-w-[140px]"
              >
                <option value="all">All Feedback</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Filter - Mobile */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium w-full touch-manipulation"
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showMobileFilter ? 'rotate-180' : ''}`} />
              </button>
              
              {showMobileFilter && (
                <div className="mt-2 p-3 bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 shadow-lg animate-slide-down">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Filter by status:
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      setShowMobileFilter(false);
                    }}
                    className="w-full px-3 py-2.5 border border-secondary-300 dark:border-secondary-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white touch-manipulation"
                  >
                    <option value="all">All Feedback</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-secondary-800 p-3 sm:p-4 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700">
            <div className="text-lg sm:text-2xl font-bold text-secondary-900 dark:text-white">
              {feedbacks.length}
            </div>
            <div className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-300">Total Feedback</div>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-3 sm:p-4 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
              {feedbacks.filter(f => f.status === 'pending').length}
            </div>
            <div className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-300">Pending</div>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-3 sm:p-4 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {feedbacks.filter(f => f.status === 'reviewed').length}
            </div>
            <div className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-300">Reviewed</div>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-3 sm:p-4 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {feedbacks.filter(f => f.status === 'resolved').length}
            </div>
            <div className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-300">Resolved</div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white">
                Feedback Records
              </h2>
              <span className="text-sm text-secondary-500 dark:text-secondary-400">
                {filteredFeedbacks.length} {filteredFeedbacks.length === 1 ? 'result' : 'results'}
              </span>
            </div>
            
            {filteredFeedbacks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-secondary-400 dark:text-secondary-500 text-4xl mb-3">📝</div>
                <p className="text-secondary-600 dark:text-secondary-300 text-base">
                  {searchTerm ? 'No feedback found matching your search' : 
                   filter === 'all' ? 'No feedback records found' : `No ${filter} feedback found`}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeedbacks.map((feedback) => (
                  <div
                    key={feedback._id}
                    className="border border-secondary-200 dark:border-secondary-600 rounded-xl p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-all duration-200 touch-manipulation"
                  >
                    {/* Mobile Layout */}
                    <div className="block sm:hidden space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-secondary-900 dark:text-white text-sm line-clamp-2 mb-2">
                            {feedback.subject}
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(feedback.status)}`}>
                              {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(feedback.category)}`}>
                              {feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)}
                            </span>
                          </div>
                        </div>
                        {feedback.status !== 'resolved' && (
                          <button
                            onClick={() => openMobileModal(feedback)}
                            className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1 touch-manipulation btn-mobile"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>Reply</span>
                          </button>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-3 space-y-2">
                        <div className="flex items-center text-xs text-secondary-600 dark:text-secondary-300">
                          <User className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="truncate font-medium">{feedback.name}</span>
                        </div>
                        <div className="flex items-center text-xs text-secondary-600 dark:text-secondary-300">
                          <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="truncate">{feedback.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-secondary-600 dark:text-secondary-300">
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span>{feedback.phone}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span>{formatDate(feedback.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Feedback Content */}
                      <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-600 rounded-lg p-3">
                        <p className="text-sm text-secondary-700 dark:text-secondary-200 line-clamp-3 leading-relaxed">
                          {feedback.feedback}
                        </p>
                      </div>

                      {/* Admin Response */}
                      {feedback.adminResponse && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                              Admin Response
                            </span>
                          </div>
                          <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
                            {feedback.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-secondary-900 dark:text-white">
                              {feedback.subject}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(feedback.status)}`}>
                              {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(feedback.category)}`}>
                              {feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-secondary-600 dark:text-secondary-300 mb-2">
                            <span className="font-medium">From:</span> {feedback.name} ({feedback.email})
                            <span className="ml-4 font-medium">Phone:</span> {feedback.phone}
                            <span className="ml-4 font-medium">Date:</span> {formatDate(feedback.createdAt)}
                          </div>
                          
                          <p className="text-secondary-700 dark:text-secondary-200 mb-3">
                            {feedback.feedback}
                          </p>
                          
                          {feedback.adminResponse && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                              <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Admin Response:
                              </div>
                              <p className="text-blue-800 dark:text-blue-200 text-sm">
                                {feedback.adminResponse}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {feedback.status !== 'resolved' && (
                          <button
                            onClick={() => setSelectedFeedback(feedback)}
                            className="ml-4 bg-primary-600 hover:bg-primary-700 text-white text-sm px-4 py-2 rounded-md transition-colors flex items-center"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Respond
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Response Modal */}
        {selectedFeedback && !showMobileModal && (
          <div className="hidden sm:block fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                    Respond to Feedback
                  </h3>
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-4 p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-2">
                    {selectedFeedback.subject}
                  </h4>
                  <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-2">
                    From: {selectedFeedback.name} ({selectedFeedback.email})
                  </p>
                  <p className="text-secondary-700 dark:text-secondary-200">
                    {selectedFeedback.feedback}
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Your Response
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows="4"
                    className="block w-full border border-secondary-300 dark:border-secondary-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
                    placeholder="Enter your response..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="px-4 py-2 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRespond(selectedFeedback._id)}
                    disabled={isResponding || !responseText.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isResponding ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Response Modal */}
        {showMobileModal && selectedFeedback && (
          <div className="sm:hidden fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
            <div className="bg-white dark:bg-secondary-800 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
              <div className="p-4">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-secondary-200 dark:border-secondary-700">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                    Respond to Feedback
                  </h3>
                  <button
                    onClick={closeMobileModal}
                    className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 p-1 touch-manipulation"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Feedback Details */}
                <div className="mb-4 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-2 text-sm">
                    {selectedFeedback.subject}
                  </h4>
                  <p className="text-xs text-secondary-600 dark:text-secondary-300 mb-2">
                    From: {selectedFeedback.name}
                  </p>
                  <p className="text-sm text-secondary-700 dark:text-secondary-200 line-clamp-3">
                    {selectedFeedback.feedback}
                  </p>
                </div>
                
                {/* Response Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Your Response
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows="4"
                    className="block w-full border border-secondary-300 dark:border-secondary-600 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white text-sm touch-manipulation resize-none"
                    placeholder="Enter your response..."
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    {responseText.length}/500 characters
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeMobileModal}
                    className="flex-1 px-4 py-3 text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 rounded-lg transition-colors font-medium text-sm touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRespond(selectedFeedback._id)}
                    disabled={isResponding || !responseText.trim()}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2 touch-manipulation"
                  >
                    {isResponding ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Response</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherFeedbackManagement;
