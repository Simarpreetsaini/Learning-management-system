import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { toast } from '../../utils/toast';

const PublicNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicNotices();
  }, []);

  const fetchPublicNotices = async () => {
    try {
      const response = await axiosInstance.get('/notices/public');
      const sortedNotices = response.data.notices.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setNotices(sortedNotices);
    } catch (error) {
      toast.error('Failed to fetch public notices');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Public Notices</h2>
      {notices.length === 0 ? (
        <p className="text-gray-500">No public notices available</p>
      ) : (
        notices.map((notice) => (
          <div key={notice._id} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{notice.title}</h3>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(notice.priority)}`}>
                    {notice.priority}
                  </span>
                  <span className="text-sm text-gray-500">
                    Posted on {new Date(notice.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{notice.body}</p>
            {notice.noticedocument && (
              <div className="mt-4">
                <a
                  href={`/api/notices/${notice._id}/download`}
                  className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Document
                </a>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default PublicNotices;
