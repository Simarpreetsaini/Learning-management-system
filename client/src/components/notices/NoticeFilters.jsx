import React, { useState } from 'react';
import { Search, Filter, X, Calendar, Tag, User, SortAsc, SortDesc } from 'lucide-react';
import { Button, Input, Card } from '../ui';

const NoticeFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedPriority,
  setSelectedPriority,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onSearch,
  onClearFilters,
  categories = [],
  priorities = [],
  showAdvanced = false,
  onToggleAdvanced
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedPriority('');
    setSortBy('timestamp');
    setSortOrder('desc');
    onClearFilters();
    setIsAdvancedOpen(false);
  };

  const activeFiltersCount = [
    selectedCategory,
    selectedPriority,
    searchTerm,
    sortBy !== 'timestamp' || sortOrder !== 'desc'
  ].filter(Boolean).length;

  const sortOptions = [
    { value: 'timestamp', label: 'Date Created' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' },
    { value: 'viewCount', label: 'Views' }
  ];

  return (
    <Card className="mb-6">
      <div className="space-y-4">
        {/* Mobile-First Search Bar */}
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-10 py-3 text-sm border-secondary-300 focus:border-primary-500 focus:ring-primary-500 w-full"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600 p-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          {/* Mobile Action Buttons */}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 py-3">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="px-4 py-3 relative"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Mobile-First Category Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Categories</span>
            <span className="text-xs text-secondary-500 dark:text-secondary-400">Tap to filter</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                selectedCategory === '' 
                  ? 'bg-primary-600 text-white shadow-md' 
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
                  selectedCategory === category 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {isAdvancedOpen && (
          <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700 animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Priority Level
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:text-white text-sm"
                >
                  <option value="">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority} value={priority} className="capitalize">
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-800 dark:text-white text-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Sort Order
                </label>
                <div className="flex rounded-lg border border-secondary-300 dark:border-secondary-600 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSortOrder('desc')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      sortOrder === 'desc'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                    }`}
                  >
                    <SortDesc className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortOrder('asc')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-secondary-300 dark:border-secondary-600 ${
                      sortOrder === 'asc'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                    }`}
                  >
                    <SortAsc className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                {activeFiltersCount > 0 ? (
                  <span>{activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied</span>
                ) : (
                  <span>No filters applied</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={activeFiltersCount === 0}
                  className="text-secondary-600 hover:text-secondary-800"
                >
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdvancedOpen(false)}
                  className="text-secondary-600 hover:text-secondary-800"
                >
                  Hide Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NoticeFilters;
