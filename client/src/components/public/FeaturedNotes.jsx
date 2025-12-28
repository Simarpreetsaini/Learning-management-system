import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { paidNotesApi } from '../../api/paidNotesApi';
import { toast } from '../../utils/toast';
import { AuthContext } from '../../context/AuthContext';

const FeaturedNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchFeaturedNotes();
  }, []);

  const fetchFeaturedNotes = async () => {
    try {
      const response = await paidNotesApi.getAllNotes({ limit: 4 });
      setNotes(response.data);
    } catch (error) {
      toast.error('Failed to fetch featured notes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-48 animate-pulse"></div>
          <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-20 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="card animate-pulse">
              <div className="card-body">
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-3"></div>
                <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded mb-4 w-1/2"></div>
                <div className="h-20 bg-secondary-200 dark:bg-secondary-700 rounded mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-16"></div>
                  <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-Optimized Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-secondary-900 dark:text-white">
          Premium Study Notes
        </h2>
        <Link
          to="/paid-notes"
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors text-sm sm:text-base self-start sm:self-auto"
        >
          View All →
        </Link>
      </div>
      
      {notes.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <div className="flex flex-col items-center">
            <svg
              className="h-10 w-10 sm:h-12 sm:w-12 text-secondary-400 dark:text-secondary-600 mb-3 sm:mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-secondary-500 dark:text-secondary-400 text-sm sm:text-base">No premium notes available</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {notes.map((note) => (
            <div key={note._id} className="card-hover group">
              <div className="card-body p-4 sm:p-6">
                {/* Header Section - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 mb-3">
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-primary-600 bg-primary-100 dark:bg-primary-900 dark:text-primary-200 rounded-full self-start">
                    {note.category}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-success-600 dark:text-success-400 self-start sm:self-auto">
                    ₹{note.price}
                  </span>
                </div>
                
                {/* Title - Mobile Optimized */}
                <h3 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                  {note.title}
                </h3>
                
                {/* Subject - Mobile Optimized */}
                {note.subject && (
                  <p className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 font-medium mb-2">
                    Subject: {note.subject?.name || 'Subject not specified'}
                  </p>
                )}
                
                {/* Description - Mobile Optimized */}
                {note.description && (
                  <p className="text-secondary-700 dark:text-secondary-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
                    {note.description}
                  </p>
                )}
                
                {/* Footer Section - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 border-t border-secondary-200 dark:border-secondary-700">
                  {user && user.role === 'Teacher' ? (
                    <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-400">
                      <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>{note.salesCount || 0} sales</span>
                    </div>
                  ) : (
                    <div className="hidden sm:block"></div>
                  )}
                  <Link
                    to={`/paid-notes/${note._id}`}
                    className="btn btn-primary btn-sm w-full sm:w-auto btn-mobile text-xs sm:text-sm py-2 sm:py-1.5 px-3 sm:px-4"
                  >
                    Buy Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedNotes;
