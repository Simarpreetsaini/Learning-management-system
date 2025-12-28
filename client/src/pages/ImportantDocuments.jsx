import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ImportantDocuments = () => {
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    impdocument: null
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axiosInstance.get('/important-documents');
      setDocuments(response.data.documents || []);
    } catch (error) {
      toast.error('Failed to fetch important documents');
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

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      impdocument: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const uploadData = new FormData();
    uploadData.append('title', formData.title);
    uploadData.append('body', formData.body);
    if (formData.impdocument) {
      uploadData.append('impdocument', formData.impdocument);
    }

    try {
      await axiosInstance.post('/important-documents', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Important document added successfully');
      setShowAddForm(false);
      setFormData({
        title: '',
        body: '',
        impdocument: null
      });
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add document');
    }
  };

  const searchDocuments = () => {
    if (!searchTerm.trim()) {
      fetchDocuments();
      return;
    }

    const filtered = documents.filter(doc =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.body?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDocuments(filtered);
  };

  const downloadDocument = async (docId, title) => {
    try {
      console.log(`Starting download for document: ${title} (ID: ${docId})`);
      
      const response = await axiosInstance.get(`/important-documents/${docId}/download`, {
        responseType: 'blob'
      });
      
      // Check if response is actually a blob (file data)
      if (response.data instanceof Blob && response.data.size > 0) {
        // Get filename from Content-Disposition header or use title
        let filename = title;
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        // Ensure filename has an extension if it doesn't already
        if (!filename.includes('.')) {
          // Try to determine extension from content type
          const contentType = response.headers['content-type'];
          if (contentType) {
            if (contentType.includes('pdf')) filename += '.pdf';
            else if (contentType.includes('msword')) filename += '.doc';
            else if (contentType.includes('wordprocessingml')) filename += '.docx';
            else if (contentType.includes('text')) filename += '.txt';
            else if (contentType.includes('image/jpeg')) filename += '.jpg';
            else if (contentType.includes('image/png')) filename += '.png';
            else filename += '.pdf'; // default fallback
          } else {
            filename += '.pdf'; // default fallback
          }
        }
        
        // Create download link
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`Download completed successfully: ${filename}`);
        toast.success('Download completed successfully');
      } else {
        // Handle case where response might be JSON error
        console.error('Invalid response data - not a blob or empty');
        toast.error('Failed to download document - invalid response');
      }
    } catch (error) {
      console.error('Download error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        console.error(`Server error: ${status}`, error.response.data);
        if (status === 404) {
          toast.error('Document not found');
        } else if (status === 500) {
          toast.error('Server error occurred while downloading');
        } else {
          toast.error(`Download failed: ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        // Network error
        console.error('Network error:', error.request);
        toast.error('Network error - please check your connection');
      } else {
        // Other error
        console.error('Other error:', error.message);
        toast.error('Failed to download document');
      }
    }
  };

  const deleteDocument = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axiosInstance.delete(`/important-documents/${docId}`);
        toast.success('Document deleted successfully');
        fetchDocuments();
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-padding safe-top safe-bottom min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 pt-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          📋 Documents
        </h1>
        {(user?.role === 'Teacher' || user?.role === 'Admin') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary w-full sm:w-auto min-h-[44px] text-sm sm:text-base font-medium"
          >
            Add Document
          </button>
        )}
      </div>

      {/* Search Section - Mobile Responsive */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search documents by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
              className="input w-full min-h-[44px] text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={searchDocuments}
              className="btn-primary flex-1 sm:flex-none min-h-[44px] px-4 sm:px-6 text-sm sm:text-base"
            >
              Search
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                fetchDocuments();
              }}
              className="btn-secondary flex-1 sm:flex-none min-h-[44px] px-4 sm:px-6 text-sm sm:text-base"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form - Mobile Optimized */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto safe-top safe-bottom">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Add Important Document
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter document title"
                  className="input w-full min-h-[44px] text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description/Content
                </label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Enter document description or content"
                  className="input w-full min-h-[100px] text-sm sm:text-base resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Document File
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="input w-full min-h-[44px] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary w-full sm:w-auto min-h-[44px] order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto min-h-[44px] order-1 sm:order-2"
                >
                  Add Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents List - Mobile Responsive */}
      <div className="space-y-4 sm:space-y-6">
        {documents.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              No important documents found
            </p>
          </div>
        ) : (
          documents.map(doc => (
            <div key={doc._id} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="card-body">
                {/* Document Header - Mobile Responsive */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 break-words">
                      {doc.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="badge-error inline-flex items-center w-fit">
                        Important
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Added: {new Date(doc.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Document Content */}
                {doc.body && (
                  <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                      {doc.body}
                    </p>
                  </div>
                )}

                {/* Document Footer - Mobile Responsive */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <span className="mr-2">📄</span>
                    <span>Document available for download</span>
                  </div>
                  
                  {/* Action Buttons - Mobile Responsive */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={() => downloadDocument(doc._id, doc.title)}
                      className="btn-success w-full sm:w-auto min-h-[44px] text-sm font-medium"
                    >
                      <span className="mr-2">⬇️</span>
                      Download
                    </button>
                    {(user?.role === 'Admin' || user?.role === 'Teacher') && (
                      <button
                        onClick={() => deleteDocument(doc._id)}
                        className="btn-error w-full sm:w-auto min-h-[44px] text-sm font-medium"
                      >
                        <span className="mr-2">🗑️</span>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ImportantDocuments;
