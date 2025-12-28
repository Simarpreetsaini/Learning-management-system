import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { teacherNotesApi, validatePrice } from '../api/paidNotesApi';
import { getAllSubjects } from '../api/subjectsApi';
import { AuthContext } from '../context/AuthContext';
import { isTeacher } from '../utils/roleUtils';
import FileUpload from '../components/paid-notes/FileUpload';
import { toast } from '../utils/toast';

const CreatePaidNote = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    category: 'Notes',
    price: '',
    file: null
  });
  const [errors, setErrors] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  const categories = ['Notes', 'Ebook', 'Question Paper', 'Study Guide', 'Other'];

  // Fetch subjects from database
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setSubjectsLoading(true);
        const response = await getAllSubjects();
        if (response.success) {
          setSubjects(response.subjects || []);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast.error('Failed to load subjects');
        // Fallback to empty array if API fails
        setSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileSelect = (file) => {
    setFormData(prev => ({
      ...prev,
      file
    }));
    
    if (errors.file) {
      setErrors(prev => ({
        ...prev,
        file: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.price || !validatePrice(formData.price)) {
      newErrors.price = 'Please enter a valid price greater than 0';
    }

    if (!formData.file) {
      newErrors.file = 'Please upload a file';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await teacherNotesApi.createNote(formData);
      toast.success('Note uploaded successfully!');
      navigate('/teacher/paid-notes');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload note');
      console.error('Error creating note:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isTeacher(user)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">Only teachers can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto container-padding py-4 sm:py-6 lg:py-8">
      {/* Mobile-Optimized Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/teacher/paid-notes')}
          className="mb-3 sm:mb-4 btn-mobile inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          <span className="text-sm sm:text-base">Back to My Notes</span>
        </button>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload New Paid Note</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Share your knowledge and earn from your expertise</p>
      </div>

      {/* Mobile-Optimized Form */}
      <div className="bg-white dark:bg-secondary-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Title - Mobile Optimized */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`block w-full border ${
                errors.title ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg shadow-sm py-2.5 sm:py-2 px-3 text-sm sm:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-secondary-700 dark:text-white touch-manipulation`}
              placeholder="Enter a descriptive title for your note"
            />
            {errors.title && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Description - Mobile Optimized */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className={`block w-full border ${
                errors.description ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg shadow-sm py-2.5 sm:py-2 px-3 text-sm sm:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-secondary-700 dark:text-white touch-manipulation resize-y`}
              placeholder="Describe what students will learn from this note"
            />
            {errors.description && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Subject and Category - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject *
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                disabled={subjectsLoading}
                className={`block w-full border ${
                  errors.subject ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg shadow-sm py-2.5 sm:py-2 px-3 text-sm sm:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-secondary-700 dark:text-white touch-manipulation`}
              >
                <option value="">
                  {subjectsLoading ? 'Loading subjects...' : 'Select Subject'}
                </option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {errors.subject && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.subject}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 sm:py-2 px-3 text-sm sm:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-secondary-700 dark:text-white touch-manipulation"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price - Mobile Optimized */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price (₹) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              min="1"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              className={`block w-full border ${
                errors.price ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg shadow-sm py-2.5 sm:py-2 px-3 text-sm sm:text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-secondary-700 dark:text-white touch-manipulation`}
              placeholder="Enter price in rupees"
              inputMode="decimal"
            />
            {errors.price && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.price}</p>
            )}
          </div>

          {/* File Upload - Mobile Optimized */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload File *
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-6">
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf,.doc,.docx"
                maxSize={10}
              />
            </div>
            {errors.file && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.file}</p>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Supported formats: PDF, DOC, DOCX. Maximum size: 10MB
            </p>
          </div>

          {/* Mobile-Optimized Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/teacher/paid-notes')}
              className="btn-mobile w-full sm:w-auto order-2 sm:order-1 px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn-mobile w-full sm:w-auto order-1 sm:order-2 inline-flex items-center justify-center px-4 py-2.5 sm:py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                loading
                  ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed opacity-75'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span>Upload Note</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePaidNote;
