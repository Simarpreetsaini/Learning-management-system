import React, { useState } from 'react';
import { submitFeedback } from '../api/feedbackApi';
import { toast } from '../utils/toast';
import SmartHeader from '../components/SmartHeader';

const PublicFeedback = () => {
  const [formData, setFormData] = useState({
    subject: '',
    feedback: '',
    name: '',
    email: '',
    phone: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitFeedback(formData);
      toast.success('Feedback submitted successfully! We will review it soon.');
      
      // Reset form
      setFormData({
        subject: '',
        feedback: '',
        name: '',
        email: '',
        phone: '',
        category: 'general'
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCharacterCountColor = (length, max) => {
    const percentage = (length / max) * 100;
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 80) return 'text-yellow-500';
    return 'text-secondary-500';
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 safe-top safe-bottom">
      <SmartHeader />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-10 animate-fade-in">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary-900 dark:text-white mb-4 text-balance">
              Share Your Feedback
            </h1>
            <p className="text-base sm:text-lg text-secondary-600 dark:text-secondary-300 max-w-xl mx-auto leading-relaxed">
              We value your feedback! Help us improve our LMS platform by sharing your thoughts, suggestions, or reporting any issues.
            </p>
          </div>

          {/* Feedback Form */}
          <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-lg border border-secondary-200 dark:border-secondary-700 p-6 sm:p-8 animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="border-b border-secondary-200 dark:border-secondary-700 pb-4">
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                    Personal Information
                  </h2>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Please provide your contact details so we can follow up if needed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={() => handleFocus('name')}
                        onBlur={handleBlur}
                        required
                        maxLength={50}
                        className="w-full px-4 py-3 sm:py-3.5 border border-secondary-300 dark:border-secondary-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white text-base transition-all duration-200 touch-manipulation"
                        placeholder="Enter your full name"
                      />
                      {focusedField === 'name' && (
                        <div className="absolute inset-0 rounded-xl ring-2 ring-primary-500 ring-opacity-50 pointer-events-none animate-pulse"></div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => handleFocus('email')}
                        onBlur={handleBlur}
                        required
                        className="w-full px-4 py-3 sm:py-3.5 border border-secondary-300 dark:border-secondary-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white text-base transition-all duration-200 touch-manipulation"
                        placeholder="Enter your email address"
                      />
                      {focusedField === 'email' && (
                        <div className="absolute inset-0 rounded-xl ring-2 ring-primary-500 ring-opacity-50 pointer-events-none animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onFocus={() => handleFocus('phone')}
                      onBlur={handleBlur}
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className="w-full px-4 py-3 sm:py-3.5 border border-secondary-300 dark:border-secondary-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white text-base transition-all duration-200 touch-manipulation"
                      placeholder="Enter 10-digit phone number"
                    />
                    {focusedField === 'phone' && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-primary-500 ring-opacity-50 pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                  <p className="text-xs text-secondary-500 mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Please enter a 10-digit phone number
                  </p>
                </div>
              </div>

              {/* Feedback Details Section */}
              <div className="space-y-6">
                <div className="border-b border-secondary-200 dark:border-secondary-700 pb-4">
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                    Feedback Details
                  </h2>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Help us categorize and understand your feedback better.
                  </p>
                </div>

                {/* Feedback Category */}
                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Feedback Category
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      onFocus={() => handleFocus('category')}
                      onBlur={handleBlur}
                      className="w-full px-4 py-3 sm:py-3.5 border border-secondary-300 dark:border-secondary-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white text-base transition-all duration-200 touch-manipulation appearance-none bg-white dark:bg-secondary-700"
                    >
                      <option value="general">💬 General Feedback</option>
                      <option value="course">📚 Course Related</option>
                      <option value="platform">🔧 Platform/Technical Issues</option>
                      <option value="instructor">👨‍🏫 Instructor Related</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {focusedField === 'category' && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-primary-500 ring-opacity-50 pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Subject *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onFocus={() => handleFocus('subject')}
                      onBlur={handleBlur}
                      required
                      minLength={3}
                      maxLength={100}
                      className="w-full px-4 py-3 sm:py-3.5 border border-secondary-300 dark:border-secondary-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white text-base transition-all duration-200 touch-manipulation"
                      placeholder="Brief subject of your feedback"
                    />
                    {focusedField === 'subject' && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-primary-500 ring-opacity-50 pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-secondary-500">
                      Minimum 3 characters required
                    </p>
                    <p className={`text-xs font-medium ${getCharacterCountColor(formData.subject.length, 100)}`}>
                      {formData.subject.length}/100
                    </p>
                  </div>
                </div>

                {/* Feedback Message */}
                <div className="space-y-2">
                  <label htmlFor="feedback" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Your Feedback *
                  </label>
                  <div className="relative">
                    <textarea
                      id="feedback"
                      name="feedback"
                      value={formData.feedback}
                      onChange={handleChange}
                      onFocus={() => handleFocus('feedback')}
                      onBlur={handleBlur}
                      required
                      minLength={10}
                      maxLength={1000}
                      rows={6}
                      className="w-full px-4 py-3 sm:py-3.5 border border-secondary-300 dark:border-secondary-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white resize-vertical text-base min-h-[140px] sm:min-h-[160px] transition-all duration-200 touch-manipulation"
                      placeholder="Please share your detailed feedback, suggestions, or report any issues you've encountered. Be as specific as possible to help us understand and address your concerns effectively."
                    />
                    {focusedField === 'feedback' && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-primary-500 ring-opacity-50 pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-secondary-500 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Minimum 10 characters required
                    </p>
                    <p className={`text-xs font-medium ${getCharacterCountColor(formData.feedback.length, 1000)}`}>
                      {formData.feedback.length}/1000
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 sm:pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto sm:min-w-[200px] bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-primary-400 disabled:to-primary-500 text-white font-semibold py-4 sm:py-3 px-8 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-md touch-manipulation btn-mobile"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Feedback
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Additional Information */}
          <div className="mt-8 p-4 sm:p-6 bg-secondary-50 dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-secondary-900 dark:text-white mb-2">
                  What happens after you submit?
                </h3>
                <ul className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-300 space-y-1">
                  <li>• We'll review your feedback within 24-48 hours</li>
                  <li>• You'll receive an email confirmation shortly</li>
                  <li>• Our team will respond if further clarification is needed</li>
                  <li>• Your feedback helps us improve the platform for everyone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-6 text-center">
            <p className="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400">
              Need immediate assistance? Contact us directly at{' '}
              <a href="mailto:support@lms.edu" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                support@lms.edu
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicFeedback;
