import React from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  GraduationCap, 
  Building, 
  Eye, 
  Download, 
  MoreVertical,
  CheckSquare,
  Square
} from 'lucide-react';

const MobileStudentCard = ({ 
  student, 
  isSelected, 
  onSelect, 
  onView, 
  onExport,
  showActions = true 
}) => {
  const getPhotoUrl = () => {
    if (student.photo) {
      return `${import.meta.env.VITE_API_URL}/uploads/${student.photo}`;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3 touch-manipulation">
      {/* Header with selection and photo */}
      <div className="flex items-start gap-3 mb-3">
        {/* Selection checkbox */}
        <button
          onClick={() => onSelect(student._id)}
          className="mt-1 p-1 touch-manipulation"
          aria-label={`${isSelected ? 'Deselect' : 'Select'} ${student.fullname}`}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-blue-600" />
          ) : (
            <Square className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {/* Student photo */}
        <div className="flex-shrink-0">
          {getPhotoUrl() ? (
            <img
              src={getPhotoUrl()}
              alt={`${student.fullname}'s photo`}
              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center ${getPhotoUrl() ? 'hidden' : 'flex'}`}
          >
            <User className="h-6 w-6 text-gray-400" />
          </div>
        </div>

        {/* Student basic info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">
            {student.fullname}
          </h3>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-medium">Roll:</span>
              <span>{student.universityRollNo}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-medium">Class:</span>
              <span>{student.classRollNo}</span>
            </div>
          </div>
        </div>

        {/* Entry type badge */}
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            student.lateralEntry 
              ? 'bg-orange-100 text-orange-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {student.lateralEntry ? 'Lateral' : 'Regular'}
          </span>
        </div>
      </div>

      {/* Academic info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3 text-gray-500 flex-shrink-0" />
            <span className="text-gray-600 truncate">
              {student.department?.name || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3 text-gray-500 flex-shrink-0" />
            <span className="text-gray-600 truncate">
              {student.semester?.name || 'N/A'}
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className="text-gray-500 text-xs">Section:</span>
            <span className="text-gray-600 font-medium">{student.section}</span>
            <span className="text-gray-400 mx-1">•</span>
            <span className="text-gray-500 text-xs">Session:</span>
            <span className="text-gray-600 font-medium">{student.session}</span>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs">
          <Mail className="h-3 w-3 text-gray-500 flex-shrink-0" />
          <span className="text-gray-600 truncate">{student.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Phone className="h-3 w-3 text-gray-500 flex-shrink-0" />
          <span className="text-gray-600">{student.phone}</span>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => onView(student._id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors touch-manipulation"
          >
            <Eye className="h-3 w-3" />
            <span>View</span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => onExport(student._id, 'excel')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors touch-manipulation"
            >
              <Download className="h-3 w-3" />
              <span>Excel</span>
            </button>
          </div>
          
          <button
            onClick={() => onExport(student._id, 'pdf')}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors touch-manipulation"
          >
            <Download className="h-3 w-3" />
            <span>PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileStudentCard;
