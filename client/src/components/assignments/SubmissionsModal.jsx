import React from 'react';
import { X, User, CheckCircle, AlertCircle, FileText, Calendar } from 'lucide-react';

const SubmissionsModal = ({ assignment, onClose }) => {
  if (!assignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white truncate">
              Submissions for: {assignment.title}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
              {assignment.submissions?.length || 0} submission{(assignment.submissions?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 flex-shrink-0 p-1"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {assignment.submissions && assignment.submissions.length > 0 ? (
            <>
              {/* Desktop List View - Hidden on mobile */}
              <div className="hidden md:block">
                <ul className="divide-y divide-secondary-200 dark:divide-secondary-700">
                  {assignment.submissions.map((submission, index) => (
                    <li key={index} className="py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <User className="h-6 w-6 text-secondary-500 dark:text-secondary-400" />
                        <div>
                          <p className="text-sm font-medium text-secondary-900 dark:text-white">
                            {submission.studentDetails?.fullname || submission.studentId.name}
                          </p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">
                            Roll No: {submission.studentDetails?.classRollNo || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {submission.isGraded ? (
                          <CheckCircle className="h-5 w-5 text-green-600" title="Graded" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" title="Not Graded" />
                        )}
                        <span className="text-sm text-secondary-700 dark:text-secondary-300">
                          {submission.submissionDate ? new Date(submission.submissionDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile Card View - Visible on mobile */}
              <div className="md:hidden space-y-3">
                {assignment.submissions.map((submission, index) => (
                  <div key={index} className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 border border-secondary-200 dark:border-secondary-600">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <User className="h-5 w-5 text-secondary-500 dark:text-secondary-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                            {submission.studentDetails?.fullname || submission.studentId.name}
                          </p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">
                            Roll No: {submission.studentDetails?.classRollNo || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {submission.isGraded ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Graded</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs text-yellow-600 font-medium">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-secondary-600 dark:text-secondary-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {submission.submissionDate ? new Date(submission.submissionDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {submission.submissionFile && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">File attached</span>
                        </div>
                      )}
                    </div>

                    {submission.isGraded && submission.grade && (
                      <div className="mt-2 pt-2 border-t border-secondary-200 dark:border-secondary-600">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary-500 dark:text-secondary-400">Grade:</span>
                          <span className="text-sm font-semibold text-secondary-900 dark:text-white">
                            {submission.grade}/{assignment.maxMarks || 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-secondary-400" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                No submissions yet
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                Students haven't submitted their assignments yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionsModal;
