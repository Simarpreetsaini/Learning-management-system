import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  BookOpen, 
  User, 
  SortAsc, 
  SortDesc,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ChevronDown
} from 'lucide-react';
import { Button, Input } from '../ui';

const AssignmentFilters = ({ 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFilterChange, 
  sortBy, 
  onSortChange,
  sortOrder,
  onSortOrderChange,
  subjects = [],
  userRole,
  onClearFilters,
  assignmentStats = {}
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const statusOptions = userRole === 'Student' 
    ? [
        { value: 'all', label: 'All Assignments', icon: Star, count: assignmentStats.total || 0 },
        { value: 'pending', label: 'Pending', icon: Clock, count: assignmentStats.pending || 0 },
        { value: 'submitted', label: 'Submitted', icon: CheckCircle, count: assignmentStats.submitted || 0 },
        { value: 'overdue', label: 'Overdue', icon: AlertCircle, count: assignmentStats.overdue || 0 }
      ]
    : [
        { value: 'all', label: 'All Assignments', icon: Star, count: assignmentStats.total || 0 },
        { value: 'active', label: 'Active', icon: CheckCircle, count: assignmentStats.active || 0 },
        { value: 'grading', label: 'Need Grading', icon: Clock, count: assignmentStats.needGrading || 0 }
      ];

  const sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'title', label: 'Title' },
    { value: 'subject', label: 'Subject' },
    { value: 'maxMarks', label: 'Max Marks' },
    { value: 'createdAt', label: 'Created Date' }
  ];

  const hasActiveFilters = () => {
    return searchTerm || 
           filters.status !== 'all' || 
           filters.subject || 
           filters.dateRange !== 'all';
  };

  return (
    <div className="space-y-4">
      {/* Main Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <Input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-11 bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 focus:border-primary-500 focus:ring-primary-500"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`h-11 px-4 border-secondary-200 dark:border-secondary-700 ${
            showAdvancedFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : ''
          }`}
        >
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Filters</span>
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="h-11 px-4 text-secondary-600 hover:text-secondary-800"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => {
          const IconComponent = option.icon;
          const isActive = filters.status === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onFilterChange({ ...filters, status: option.value })}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-100 text-primary-800 border border-primary-200 dark:bg-primary-900/30 dark:text-primary-200 dark:border-primary-800'
                  : 'bg-secondary-50 text-secondary-700 border border-secondary-200 hover:bg-secondary-100 dark:bg-secondary-800 dark:text-secondary-300 dark:border-secondary-700 dark:hover:bg-secondary-700'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span>{option.label}</span>
              {option.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-primary-200 text-primary-800 dark:bg-primary-800 dark:text-primary-200'
                    : 'bg-secondary-200 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300'
                }`}>
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg border border-secondary-200 dark:border-secondary-700 space-y-4 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                <BookOpen className="h-4 w-4 inline mr-1" />
                Subject
              </label>
              <select
                value={filters.subject || ''}
                onChange={(e) => onFilterChange({ ...filters, subject: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                <Calendar className="h-4 w-4 inline mr-1" />
                Due Date
              </label>
              <select
                value={filters.dateRange || 'all'}
                onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Due Today</option>
                <option value="tomorrow">Due Tomorrow</option>
                <option value="week">Due This Week</option>
                <option value="month">Due This Month</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:border-primary-500 focus:ring-primary-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Order
              </label>
              <Button
                variant="outline"
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full justify-center border-secondary-300 dark:border-secondary-600"
              >
                {sortOrder === 'asc' ? (
                  <>
                    <SortAsc className="h-4 w-4 mr-2" />
                    Ascending
                  </>
                ) : (
                  <>
                    <SortDesc className="h-4 w-4 mr-2" />
                    Descending
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters() && (
            <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Active filters:
                </span>
                
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 rounded-full text-xs">
                    Search: "{searchTerm}"
                    <button onClick={() => onSearchChange('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {filters.status !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 rounded-full text-xs">
                    Status: {statusOptions.find(opt => opt.value === filters.status)?.label}
                    <button onClick={() => onFilterChange({ ...filters, status: 'all' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {filters.subject && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 rounded-full text-xs">
                    Subject: {subjects.find(s => s._id === filters.subject)?.name}
                    <button onClick={() => onFilterChange({ ...filters, subject: '' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {filters.dateRange !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 rounded-full text-xs">
                    Date: {filters.dateRange}
                    <button onClick={() => onFilterChange({ ...filters, dateRange: 'all' })}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentFilters;
