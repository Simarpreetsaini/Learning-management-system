import React from 'react';
import PropTypes from 'prop-types';

const Table = ({ 
  children, 
  className = '',
  responsive = true,
  ...props 
}) => {
  const wrapperClass = responsive ? 'overflow-x-auto' : '';
  
  return (
    <div className={wrapperClass}>
      <table className={`table ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

const TableHead = ({ children, className = '', ...props }) => (
  <thead className={`table-header ${className}`} {...props}>
    {children}
  </thead>
);

const TableBody = ({ children, className = '', ...props }) => (
  <tbody className={`table-body ${className}`} {...props}>
    {children}
  </tbody>
);

const TableRow = ({ children, className = '', hover = true, ...props }) => (
  <tr 
    className={`
      ${hover ? 'hover:bg-secondary-50 dark:hover:bg-secondary-800' : ''} 
      ${className}
    `} 
    {...props}
  >
    {children}
  </tr>
);

const TableCell = ({ 
  children, 
  className = '', 
  header = false,
  align = 'left',
  ...props 
}) => {
  const Tag = header ? 'th' : 'td';
  const baseClass = header ? 'table-header-cell' : 'table-cell';
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align] || 'text-left';

  return (
    <Tag className={`${baseClass} ${alignClass} ${className}`} {...props}>
      {children}
    </Tag>
  );
};

// Empty state component for tables
const TableEmpty = ({ message = 'No data available' }) => (
  <tr>
    <td 
      colSpan="100%" 
      className="px-6 py-8 text-center text-secondary-500 dark:text-secondary-400"
    >
      <div className="flex flex-col items-center justify-center space-y-2">
        <svg 
          className="w-12 h-12 text-secondary-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
        <p>{message}</p>
      </div>
    </td>
  </tr>
);

// Loading state component for tables
const TableLoading = ({ colSpan = 1 }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-8">
      <div className="flex justify-center">
        <div className="loading-spinner h-8 w-8" />
      </div>
    </td>
  </tr>
);

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;
Table.Empty = TableEmpty;
Table.Loading = TableLoading;

Table.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  responsive: PropTypes.bool,
};

TableHead.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TableRow.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
};

TableCell.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  header: PropTypes.bool,
  align: PropTypes.oneOf(['left', 'center', 'right']),
};

TableEmpty.propTypes = {
  message: PropTypes.string,
};

TableLoading.propTypes = {
  colSpan: PropTypes.number,
};

export default Table;
