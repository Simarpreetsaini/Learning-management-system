import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import PublicPYQPortal from '../components/public/PublicPYQPortal';
import SmartHeader from '../components/SmartHeader';

const PublicPYQs = () => {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <SmartHeader />
      <div className="max-w-7xl mx-auto container-padding py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">PYQ Papers</h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Access a comprehensive collection of previous year question papers from all departments and semesters. 
            Download and practice to excel in your exams.
          </p>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-3 sm:p-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">
                Easy Search & Filter
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Find exactly what you need with advanced filtering options.
              </p>
            </div>
            
            <div className="text-center p-3 sm:p-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">
                Instant Downloads
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Download question papers instantly without registration.
              </p>
            </div>
            
            <div className="text-center p-3 sm:p-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">
                Quality Assured
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                All papers are verified by experienced teachers.
              </p>
            </div>
          </div>
        </div>

        {/* Main PYQ Portal */}
        <PublicPYQPortal />

        {/* Call to Action */}
        <div className="bg-blue-50 rounded-lg p-4 sm:p-6 mt-6 sm:mt-8 text-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Want More Features?
          </h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
            Join our platform to access additional study materials, track your progress, and connect with teachers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-6 py-3 sm:py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-auto flex items-center justify-center"
            >
              Create Free Account
            </Link>
            <Link
              to="/paid-notes"
              className="border border-blue-600 text-blue-600 px-6 py-3 sm:py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-auto flex items-center justify-center"
            >
              Explore Premium Notes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicPYQs;
