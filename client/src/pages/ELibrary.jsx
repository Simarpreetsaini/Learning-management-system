import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ELibrary = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'textbook',
    impdocument: null,
    fileurl: ''
  });

  const categories = ['textbook', 'reference', 'journal', 'research', 'magazine', 'ebook', 'other'];

  useEffect(() => {
    // Only fetch data if auth is not loading and user exists
    if (!authLoading && user) {
      fetchBooks();
    }
  }, [user, authLoading]);

  const fetchBooks = async () => {
    try {
      const response = await axiosInstance.get('/e-library');
      setBooks(response.data.items || []);
    } catch (error) {
      toast.error('Failed to fetch e-library books');
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
    uploadData.append('description', formData.description);
    uploadData.append('category', formData.category);
    uploadData.append('fileurl', formData.fileurl);
    if (formData.impdocument) {
      uploadData.append('impdocument', formData.impdocument);
    }

    try {
      await axiosInstance.post('/e-library', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Book added to e-library successfully');
      setShowAddForm(false);
      setFormData({
        title: '',
        description: '',
        category: 'textbook',
        impdocument: null,
        fileurl: ''
      });
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add book');
    }
  };

  const searchBooks = () => {
    if (!searchTerm.trim()) {
      fetchBooks();
      return;
    }

    const filtered = books.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setBooks(filtered);
  };

  const filterByCategory = (category) => {
    if (!category) {
      fetchBooks();
      return;
    }

    const filtered = books.filter(book => book.category === category);
    setBooks(filtered);
  };

  const downloadBook = async (bookId, title) => {
    try {
      const response = await axiosInstance.get(`/e-library/${bookId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download book');
    }
  };

  const openExternalLink = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'textbook': return 'bg-blue-100 text-blue-800';
      case 'reference': return 'bg-green-100 text-green-800';
      case 'journal': return 'bg-purple-100 text-purple-800';
      case 'research': return 'bg-orange-100 text-orange-800';
      case 'magazine': return 'bg-pink-100 text-pink-800';
      case 'ebook': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading spinner while auth is loading
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  // Show message if not authenticated
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to view e-library.</p>
      </div>
    );
  }

  return (
    <div className="container-padding py-4 sm:py-6">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          📚 E-Library
        </h1>
        {(user?.role === 'Teacher' || user?.role === 'Admin') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary w-full sm:w-auto text-sm sm:text-base min-h-[44px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <span className="text-lg">➕</span>
            <span>Add Book</span>
          </button>
        )}
      </div>

      {/* Search and Filter - Mobile Optimized */}
      <div className="mb-6 space-y-4">
        {/* Search Section */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
              className="input w-full text-base min-h-[44px] placeholder:text-sm sm:placeholder:text-base"
            />
          </div>
          <button
            onClick={searchBooks}
            className="btn-primary min-h-[44px] px-6 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Search</span>
            <span className="sm:hidden">🔍</span>
          </button>
        </div>

        {/* Category Filters - Mobile Scrollable */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <button
              onClick={() => {
                setSelectedCategory('');
                filterByCategory('');
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium min-h-[36px] transition-all duration-200 ${
                selectedCategory === '' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  filterByCategory(category);
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium capitalize min-h-[36px] transition-all duration-200 ${
                  selectedCategory === category 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          {/* Scroll indicator for mobile */}
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none sm:hidden"></div>
        </div>
      </div>

      {/* Mobile-Optimized Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                📚 Add New Book
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <span className="text-xl text-gray-500 dark:text-gray-400">✕</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Book Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter book title"
                    className="input w-full min-h-[44px]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Brief description of the book"
                    className="input w-full resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input w-full min-h-[44px]"
                  >
                    {categories.map(category => (
                      <option key={category} value={category} className="capitalize">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    External URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="fileurl"
                    value={formData.fileurl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/book-link"
                    className="input w-full min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Book File (Optional)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.epub"
                    className="input w-full min-h-[44px] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Supported formats: PDF, DOC, DOCX, EPUB
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                    Add Book
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Books Grid - Mobile Optimized */}
      <div className="space-y-4 sm:space-y-6">
        {books.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-6xl sm:text-8xl mb-4 opacity-50">📚</div>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
              No books found in e-library
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              {searchTerm || selectedCategory ? 'Try adjusting your search or filters' : 'Books will appear here once added'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {books.map(book => (
              <div 
                key={book._id} 
                className="card card-hover bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 transition-all duration-300"
              >
                {/* Book Header */}
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                      {book.title}
                    </h3>
                    <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(book.category)} dark:bg-opacity-20`}>
                      {book.category}
                    </span>
                  </div>
                </div>
                
                {/* Book Description */}
                {book.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {book.description}
                  </p>
                )}

                {/* Book Metadata */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                  <span className="text-sm">📅</span>
                  <span>Added: {new Date(book.timestamp).toLocaleDateString()}</span>
                </div>

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {book.impdocument && (
                    <button
                      onClick={() => downloadBook(book._id, book.title)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                    >
                      <span className="text-base">📄</span>
                      <span>Download</span>
                    </button>
                  )}
                  {book.fileurl && (
                    <button
                      onClick={() => openExternalLink(book.fileurl)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                    >
                      <span className="text-base">🔗</span>
                      <span>Open Link</span>
                    </button>
                  )}
                  {!book.impdocument && !book.fileurl && (
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-4 py-3 rounded-lg text-sm text-center min-h-[44px] flex items-center justify-center gap-2">
                      <span className="text-base">❌</span>
                      <span>No file available</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ELibrary;
