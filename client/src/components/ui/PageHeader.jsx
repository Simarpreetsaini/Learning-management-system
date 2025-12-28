import React from 'react';
import PropTypes from 'prop-types';
import Breadcrumb from './Breadcrumb';

const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <Breadcrumb 
          items={breadcrumbs} 
          className="mb-4 animate-fade-in"
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Title and Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-white sm:text-3xl animate-fade-in">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-base text-secondary-500 dark:text-secondary-400 max-w-4xl animate-fade-in">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center space-x-3 animate-fade-in">
            {actions}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-b border-secondary-200 dark:border-secondary-700 -mx-4 sm:mx-0 animate-fade-in" />
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      icon: PropTypes.node,
    })
  ),
  actions: PropTypes.node,
  className: PropTypes.string,
};

export default PageHeader;
