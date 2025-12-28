import React from 'react';

const Logo = ({ className = "w-8 h-8", showText = true, textClassName = "text-xl font-bold", color = "currentColor" }) => {
  return (
    <div className="flex items-center space-x-2">
      {/* Non-color fill graduation cap SVG logo */}
      <svg 
        className={className} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color}
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        aria-label="LMS Portal Logo"
      >
        {/* Graduation cap outline */}
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
        {/* Tassel */}
        <circle cx="12" cy="8" r="1" />
        <path d="M12 7v2" />
      </svg>
      
      {showText && (
        <span className={textClassName}>
          LMS Portal
        </span>
      )}
    </div>
  );
};

export default Logo;
