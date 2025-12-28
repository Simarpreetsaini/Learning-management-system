import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicPyqApi } from '../../api/publicPyqApi';
import { toast } from '../../utils/toast';
import { Card, Button } from '../ui';

const FeaturedPYQs = () => {
  const [pyqs, setPyqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedPYQs();
  }, []);

  const fetchFeaturedPYQs = async () => {
    try {
      const response = await publicPyqApi.getAllPyqs();
      // Get the 4 most recent PYQs
      const recentPyqs = response.pyqs?.slice(0, 4) || [];
      setPyqs(recentPyqs);
    } catch (error) {
      console.error('Failed to fetch PYQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPYQ = async (pyqId, filename) => {
    try {
      await publicPyqApi.downloadPyq(pyqId, filename);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
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
            <Card key={index} className="animate-pulse">
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded mb-3"></div>
              <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded mb-4 w-1/2"></div>
              <div className="h-16 bg-secondary-200 dark:bg-secondary-700 rounded mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-16"></div>
                <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-20"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-secondary-900 dark:text-white">
          Previous Year Questions
        </h2>
        <Link
          to="/public-pyqs"
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors text-sm sm:text-base self-start sm:self-auto"
        >
          View All →
        </Link>
      </div>
      
      {pyqs.length === 0 ? (
        <Card className="text-center py-8 sm:py-12">
          <div className="flex flex-col items-center">
            <svg
              className="h-10 w-10 sm:h-12 sm:w-12 text-secondary-400 dark:text-secondary-600 mb-3 sm:mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-secondary-500 dark:text-secondary-400 text-sm sm:text-base">No question papers available</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {pyqs.map((pyq) => (
            <Card key={pyq._id} hover className="group">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-200 text-xs font-semibold rounded-full flex-shrink-0">
                  PYQ
                </span>
                <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-400 ml-2">
                  <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Question Paper
                </div>
              </div>
              
              <h3 className="text-base sm:text-lg font-semibold text-secondary-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors break-words">
                {pyq.pyqfilename}
              </h3>
              
              <p className="text-primary-600 dark:text-primary-400 font-medium mb-3 text-sm sm:text-base truncate">
                {pyq.subject}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Department:</span>
                  <span className="font-medium text-secondary-900 dark:text-white text-right truncate ml-2">{pyq.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600 dark:text-secondary-400">Semester:</span>
                  <span className="font-medium text-secondary-900 dark:text-white text-right truncate ml-2">{pyq.semester}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-600">
                <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-400">
                  <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF Document
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => downloadPYQ(pyq._id, pyq.pyqfilename)}
                  className="w-full sm:w-auto flex items-center justify-center min-h-[44px] sm:min-h-auto text-sm font-medium"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedPYQs;
