import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  disabled = false,
  type = 'button',
  onClick,
  asChild,
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  
  const buttonClasses = `${baseClass} ${variantClass} ${sizeClass} ${className} ${isLoading ? 'opacity-75 cursor-wait' : ''}`;

  // If asChild is true, clone the child element with our props
  if (asChild) {
    const child = React.Children.only(children);
    return React.cloneElement(child, {
      className: buttonClasses,
      disabled: disabled || isLoading,
      onClick,
      ...props
    });
  }
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="loading-spinner h-4 w-4 mr-2" />
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'error', 'outline', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  asChild: PropTypes.bool
};

export default Button;
