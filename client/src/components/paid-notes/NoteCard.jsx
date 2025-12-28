import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, IndianRupee } from 'lucide-react';
import { formatPrice, formatDate } from '../../api/paidNotesApi';

const NoteCard = ({ note, isTeacherView = false }) => {
  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 card-hover">
      <div className="p-3 sm:p-4">
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-tight">
              {note.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
              {note.subject?.name || 'Subject not specified'}
            </p>
          </div>
          <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 self-start flex-shrink-0">
            {note.category}
          </span>
        </div>

        {/* Description - Mobile Optimized */}
        <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
          {note.description}
        </p>

        {/* Price and Type Section - Mobile Optimized */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 dark:bg-secondary-700 rounded-lg">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <FileText size={14} className="mr-1 sm:mr-2 flex-shrink-0" />
            <span className="text-xs sm:text-sm">Digital Note</span>
          </div>
          <div className="flex items-center font-semibold text-green-700 dark:text-green-400">
            <IndianRupee size={14} className="mr-1 flex-shrink-0" />
            <span className="text-sm sm:text-base">{formatPrice(note.price)}</span>
          </div>
        </div>

        {/* Teacher View Stats - Mobile Optimized */}
        {isTeacherView && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span className="font-medium">Sales:</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{note.salesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Revenue:</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">{formatPrice(note.salesCount * note.price)}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Uploaded:</span>
                <span>{formatDate(note.uploadDate)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button - Mobile Optimized */}
        <div className="mt-3 sm:mt-4">
          <Link
            to={`/paid-notes/${note._id}`}
            className="w-full btn-mobile inline-flex justify-center items-center px-3 sm:px-4 py-2 sm:py-2.5 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors touch-manipulation"
          >
            {isTeacherView ? 'Manage Note' : 'View Details'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
