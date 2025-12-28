import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/LoadingSpinner';

const TestRecords = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axiosInstance.get('/student/tests/my-records');
      setRecords(response.data.submissions || []);
      setPagination(response.data.pagination || {});
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch test records');
      setLoading(false);
    }
  };

  const viewReview = (testId) => {
    navigate(`/test-review/${testId}`);
  };

  const getScoreColor = (score, totalMarks) => {
    const percentage = (score / totalMarks) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score, totalMarks) => {
    const percentage = (score / totalMarks) * 100;
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container-padding safe-top safe-bottom min-h-screen">
      {/* Mobile-optimized header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Online Test Records</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">View your completed online tests and results</p>
          </div>
          <button
            onClick={() => navigate('/tests')}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            ← Back to Tests
          </button>
        </div>
      </div>

      {/* Mobile-optimized records */}
      <div className="space-y-4 sm:space-y-6">
        {records.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No online test records found</h3>
            <p className="text-gray-500 text-sm">You haven't completed any online tests yet.</p>
            <button
              onClick={() => navigate('/tests')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Take Your First Test
            </button>
          </div>
        ) : (
          records.map(record => (
            <div key={record._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6">
                {/* Mobile-optimized header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{record.testId?.title}</h3>
                    <p className="text-gray-600 mt-1 text-sm">
                      Subject: {record.testId?.subject?.name || 'N/A'}
                    </p>
                  </div>
                  
                  {/* Mobile-optimized score display */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center flex-shrink-0">
                    <div className={`p-3 rounded-lg border text-center ${getScoreBgColor(record.score, record.totalMarks)}`}>
                      <div className={`text-lg sm:text-xl font-bold ${getScoreColor(record.score, record.totalMarks)}`}>
                        {record.score}/{record.totalMarks}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {((record.score / record.totalMarks) * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    {record.testId?.allowReview && (
                      <button
                        onClick={() => viewReview(record.testId._id)}
                        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        📋 View Review
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Mobile-optimized details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <span className="font-medium text-gray-700 block">Attempt</span>
                    <p className="text-gray-900 font-semibold">#{record.attemptNumber}</p>
                  </div>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <span className="font-medium text-gray-700 block">Time Taken</span>
                    <p className="text-gray-900 font-semibold">{Math.floor(record.timeTaken)} min</p>
                  </div>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <span className="font-medium text-gray-700 block">Submitted</span>
                    <p className="text-gray-900 font-semibold">{new Date(record.submissionDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <span className="font-medium text-gray-700 block">Status</span>
                    <p className={`font-semibold ${record.isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                      {record.isCompleted ? '✅ Completed' : '⏳ In Progress'}
                    </p>
                  </div>
                </div>

                {/* Late submission warning */}
                {record.isLateSubmission && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600 text-lg">⚠️</span>
                      <span className="text-yellow-700 text-sm font-medium">Late Submission</span>
                    </div>
                  </div>
                )}

                {/* Performance indicator */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Performance</span>
                    <div className="flex items-center gap-2">
                      {((record.score / record.totalMarks) * 100) >= 80 && (
                        <span className="text-green-600 font-medium">🎉 Excellent</span>
                      )}
                      {((record.score / record.totalMarks) * 100) >= 60 && ((record.score / record.totalMarks) * 100) < 80 && (
                        <span className="text-blue-600 font-medium">👍 Good</span>
                      )}
                      {((record.score / record.totalMarks) * 100) >= 40 && ((record.score / record.totalMarks) * 100) < 60 && (
                        <span className="text-yellow-600 font-medium">📈 Average</span>
                      )}
                      {((record.score / record.totalMarks) * 100) < 40 && (
                        <span className="text-red-600 font-medium">📚 Needs Improvement</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        ((record.score / record.totalMarks) * 100) >= 80 ? 'bg-green-500' :
                        ((record.score / record.totalMarks) * 100) >= 60 ? 'bg-blue-500' :
                        ((record.score / record.totalMarks) * 100) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(record.score / record.totalMarks) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary stats */}
      {records.length > 0 && (
        <div className="mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">📈 Your Test Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{records.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Tests Taken</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {(records.reduce((sum, r) => sum + ((r.score / r.totalMarks) * 100), 0) / records.length).toFixed(1)}%
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Average Score</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {Math.max(...records.map(r => (r.score / r.totalMarks) * 100)).toFixed(1)}%
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Best Score</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {records.filter(r => r.isCompleted).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRecords;
