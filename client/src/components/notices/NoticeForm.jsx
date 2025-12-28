import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Calendar, Tag, AlertCircle, Save, Eye } from 'lucide-react';
import { Button, Input, Card } from '../ui';

const NoticeForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
  categories = [],
  priorities = [],
  visibilityOptions = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'general',
    priority: 'medium',
    visibility: 'all',
    expiryDate: '',
    tags: '',
    noticedocument: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        body: initialData.body || '',
        category: initialData.category || 'general',
        priority: initialData.priority || 'medium',
        visibility: initialData.visibility || 'all',
        expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '',
        tags: initialData.tags ? initialData.tags.join(', ') : '',
        noticedocument: null
      });
    } else {
      setFormData({
        title: '',
        body: '',
        category: 'general',
        priority: 'medium',
        visibility: 'all',
        expiryDate: '',
        tags: '',
        noticedocument: null
      });
    }
    setErrors({});
    setPreviewMode(false);
  }, [initialData, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Content is required';
    } else if (formData.body.length < 10) {
      newErrors.body = 'Content must be at least 10 characters long';
    } else if (formData.body.length > 5000) {
      newErrors.body = 'Content must be less than 5000 characters';
    }

    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiryDate < today) {
        newErrors.expiryDate = 'Expiry date cannot be in the past';
      }
    }

    if (formData.tags) {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tags.length > 10) {
        newErrors.tags = 'Maximum 10 tags allowed';
      }
      if (tags.some(tag => tag.length > 20)) {
        newErrors.tags = 'Each tag must be less than 20 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          noticedocument: 'File size must be less than 10MB'
        }));
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];

      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          noticedocument: 'Invalid file type. Please upload PDF, DOC, DOCX, PPT, PPTX, JPG, or PNG files.'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        noticedocument: file
      }));

      setErrors(prev => ({
        ...prev,
        noticedocument: ''
      }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileChange({ target: { files: [file] } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (key === 'tags') {
          const tags = formData[key].split(',').map(tag => tag.trim()).filter(tag => tag);
          formDataToSend.append(key, JSON.stringify(tags));
        } else if (key !== 'noticedocument') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append file if selected
      if (formData.noticedocument) {
        formDataToSend.append('noticedocument', formData.noticedocument);
      }

      await onSubmit(formDataToSend);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up sm:animate-scale-in">
        {/* Mobile-First Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-secondary-200 dark:border-secondary-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white truncate">
                {isEditing ? 'Edit Notice' : 'Create Notice'}
              </h2>
              <p className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-400 hidden sm:block">
                {isEditing ? 'Update notice information' : 'Share important information with your audience'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="text-secondary-600 hover:text-secondary-800 p-2"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">{previewMode ? 'Edit' : 'Preview'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-secondary-600 hover:text-secondary-800 p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile-First Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)]">
          {previewMode ? (
            // Preview Mode
            <div className="p-6">
              <Card className="max-w-2xl mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      formData.category === 'urgent' ? 'bg-error-100 text-error-800' :
                      formData.category === 'exam' ? 'bg-blue-100 text-blue-800' :
                      formData.category === 'event' ? 'bg-purple-100 text-purple-800' :
                      formData.category === 'academic' ? 'bg-indigo-100 text-indigo-800' :
                      formData.category === 'holiday' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      formData.priority === 'urgent' ? 'bg-error-100 text-error-800' :
                      formData.priority === 'high' ? 'bg-warning-100 text-warning-800' :
                      formData.priority === 'medium' ? 'bg-primary-100 text-primary-800' :
                      'bg-success-100 text-success-800'
                    }`}>
                      {formData.priority}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">
                    {formData.title || 'Notice Title'}
                  </h3>
                  
                  <p className="text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">
                    {formData.body || 'Notice content will appear here...'}
                  </p>
                  
                  {formData.tags && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {formData.expiryDate && (
                    <div className="p-3 bg-warning-50 border-l-4 border-warning-400 rounded">
                      <p className="text-sm text-warning-800">
                        Expires on: {new Date(formData.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            // Form Mode
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Notice Title *
                    </label>
                    <Input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter a clear and descriptive title..."
                      className={`${errors.title ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-secondary-500">
                      {formData.title.length}/200 characters
                    </p>
                  </div>

                  {/* Category and Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:text-white"
                      >
                        {categories.map(category => (
                          <option key={category} value={category} className="capitalize">
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:text-white"
                      >
                        {priorities.map(priority => (
                          <option key={priority} value={priority} className="capitalize">
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Visibility and Expiry */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Visibility
                      </label>
                      <select
                        name="visibility"
                        value={formData.visibility}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:text-white"
                      >
                        {visibilityOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Expiry Date (Optional)
                      </label>
                      <Input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className={`${errors.expiryDate ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                      />
                      {errors.expiryDate && (
                        <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.expiryDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      <Tag className="h-4 w-4 inline mr-1" />
                      Tags (Optional)
                    </label>
                    <Input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="e.g., important, deadline, exam (comma-separated)"
                      className={`${errors.tags ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                    />
                    {errors.tags && (
                      <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.tags}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-secondary-500">
                      Separate tags with commas. Maximum 10 tags.
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Notice Content *
                    </label>
                    <textarea
                      name="body"
                      value={formData.body}
                      onChange={handleInputChange}
                      rows="8"
                      placeholder="Write your notice content here..."
                      className={`w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:text-white resize-none ${
                        errors.body ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''
                      }`}
                    />
                    {errors.body && (
                      <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.body}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-secondary-500">
                      {formData.body.length}/5000 characters
                    </p>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      <Upload className="h-4 w-4 inline mr-1" />
                      Attachment (Optional)
                    </label>
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive
                          ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-secondary-300 dark:border-secondary-600 hover:border-secondary-400'
                      } ${errors.noticedocument ? 'border-error-300' : ''}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        id="fileInput"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      {formData.noticedocument ? (
                        <div className="space-y-2">
                          <FileText className="h-8 w-8 text-primary-600 mx-auto" />
                          <p className="text-sm font-medium text-secondary-900 dark:text-white">
                            {formData.noticedocument.name}
                          </p>
                          <p className="text-xs text-secondary-500">
                            {formatFileSize(formData.noticedocument.size)}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, noticedocument: null }))}
                            className="text-error-600 hover:text-error-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-secondary-400 mx-auto" />
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            <span className="font-medium">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-secondary-500">
                            PDF, DOC, DOCX, PPT, PPTX, JPG, PNG (Max 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                    {errors.noticedocument && (
                      <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.noticedocument}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!previewMode && (
          <div className="flex justify-end gap-3 p-6 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Update Notice' : 'Create Notice'}
                </div>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeForm;
