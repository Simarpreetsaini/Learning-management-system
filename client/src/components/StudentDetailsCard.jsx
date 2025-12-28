import React from 'react';
import { User, Calendar, Phone, Mail, GraduationCap, Building, Users, BookOpen } from 'lucide-react';
import { getStudentPhotoUrl } from '../utils/fileUtils';

const StudentDetailsCard = ({ student, showActions = false, onExport = null, onClose = null }) => {
  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) : 'N/A';
  };

  const getPhotoUrl = () => {
    return getStudentPhotoUrl(student.photo);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-7xl mx-auto overflow-hidden">
      {/* Header - Mobile First */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">STUDENT ACADEMIC DETAILS</h2>
            <p className="text-blue-100 text-sm sm:text-base mt-1">Academic Session: {student.session}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm sm:text-base font-medium">Roll No: {student.universityRollNo}</p>
            <p className="text-xs sm:text-sm text-blue-100">Class Roll: {student.classRollNo}</p>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile First Layout */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Mobile: Photo First, Desktop: Photo on Right */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Photo Section - Mobile First */}
          <div className="order-1 lg:order-2 lg:w-80 flex-shrink-0">
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 sm:p-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">Student Photograph</h4>
              
              {/* Photo Container */}
              <div className="flex justify-center mb-4">
                {getPhotoUrl() ? (
                  <img
                    src={getPhotoUrl()}
                    alt={`${student.fullname}'s photo`}
                    className="w-32 h-40 sm:w-36 sm:h-44 lg:w-40 lg:h-48 object-cover rounded-xl border-2 border-gray-300 shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-32 h-40 sm:w-36 sm:h-44 lg:w-40 lg:h-48 bg-gray-200 rounded-xl border-2 border-gray-300 flex items-center justify-center ${getPhotoUrl() ? 'hidden' : 'flex'}`}
                >
                  <div className="text-center">
                    <User className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">No Photo</p>
                    <p className="text-xs sm:text-sm text-gray-500">Available</p>
                  </div>
                </div>
              </div>
              
              {/* Student ID Cards */}
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <p className="text-xs font-medium text-gray-600 mb-1">Registration Number</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{student.universityRollNo}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <p className="text-xs font-medium text-gray-600 mb-1">Class Roll No</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{student.classRollNo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section - Mobile First */}
          <div className="order-2 lg:order-1 flex-1 space-y-6 sm:space-y-8">
            
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
                <User className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">Full Name</label>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 break-words">{student.fullname}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">Date of Birth</label>
                  <p className="text-base sm:text-lg text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span>{formatDate(student.dob)}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">Father's Name</label>
                  <p className="text-base sm:text-lg text-gray-900 break-words">{student.fathername}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">Mother's Name</label>
                  <p className="text-base sm:text-lg text-gray-900 break-words">{student.mothername}</p>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-600" />
                Academic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">Department</label>
                  <p className="text-base sm:text-lg text-gray-900 flex items-start">
                    <Building className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-1" />
                    <span className="break-words">{student.department?.name} ({student.department?.code})</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">Semester</label>
                  <p className="text-base sm:text-lg text-gray-900 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span>{student.semester?.name}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">Section</label>
                  <p className="text-base sm:text-lg text-gray-900 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span>Section {student.section}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">Entry Type</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    student.lateralEntry 
                      ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {student.lateralEntry ? 'Lateral Entry' : 'Regular Entry'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-green-50 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
                <Phone className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600">Email Address</label>
                  <p className="text-base sm:text-lg text-gray-900 flex items-start">
                    <Mail className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-1" />
                    <span className="break-all">{student.email}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">Phone Number</label>
                  <p className="text-base sm:text-lg text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span>{student.phone}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">Father's Phone</label>
                  <p className="text-base sm:text-lg text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span>{student.fatherphone}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Mobile First */}
        {showActions && (
          <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              {onExport && (
                <>
                  <button
                    onClick={() => onExport('excel')}
                    className="w-full sm:w-auto bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Export Excel
                  </button>
                  <button
                    onClick={() => onExport('pdf')}
                    className="w-full sm:w-auto bg-red-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Export PDF
                  </button>
                </>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto bg-gray-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-100 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0">
          <p>Generated on: {new Date().toLocaleDateString('en-IN')}</p>
          <p>Academic Year: {student.session}</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsCard;
