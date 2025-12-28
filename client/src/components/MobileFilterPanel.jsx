import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  X, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Search
} from 'lucide-react';

const MobileFilterPanel = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFilterChange, 
  onClearFilters,
  departments = [],
  semesters = [],
  searchQuery,
  onSearchChange,
  onSearch
}) => {
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    academic: false,
    other: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Close panel when clicking outside
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Filter Panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 lg:hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Filters & Search</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Search Section */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('search')}
              className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Search Students</span>
              </div>
              {expandedSections.search ? (
                <ChevronUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              )}
            </button>
            
            {expandedSections.search && (
              <div className="space-y-3 pl-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Search by name, roll number, or email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      onClick={onSearch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Academic Filters Section */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('academic')}
              className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🎓</span>
                <span className="font-medium text-green-900">Academic Filters</span>
              </div>
              {expandedSections.academic ? (
                <ChevronUp className="h-4 w-4 text-green-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-green-600" />
              )}
            </button>
            
            {expandedSections.academic && (
              <div className="space-y-4 pl-4">
                {/* Department */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) => onFilterChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Semester
                  </label>
                  <select
                    value={filters.semester}
                    onChange={(e) => onFilterChange('semester', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">All Semesters</option>
                    {semesters.map(sem => (
                      <option key={sem._id} value={sem._id}>{sem.name}</option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Section
                  </label>
                  <select
                    value={filters.section}
                    onChange={(e) => onFilterChange('section', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Other Filters Section */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('other')}
              className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                <span className="font-medium text-purple-900">Other Filters</span>
              </div>
              {expandedSections.other ? (
                <ChevronUp className="h-4 w-4 text-purple-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-purple-600" />
              )}
            </button>
            
            {expandedSections.other && (
              <div className="space-y-4 pl-4">
                {/* Session */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Session
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2023-2024"
                    value={filters.session}
                    onChange={(e) => onFilterChange('session', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Entry Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Entry Type
                  </label>
                  <select
                    value={filters.lateralEntry}
                    onChange={(e) => onFilterChange('lateralEntry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">All Students</option>
                    <option value="true">Lateral Entry</option>
                    <option value="false">Regular Entry</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClearFilters}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileFilterPanel;
