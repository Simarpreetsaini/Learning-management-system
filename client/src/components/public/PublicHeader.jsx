import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';
import Logo from '../Logo';

const PublicHeader = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/', icon: '🏠' },
    { label: 'Public Notices', href: '/noticeboard', icon: '📢' },
    { label: 'Previous Year Questions', href: '/public-pyqs', icon: '📄' },
    { label: 'Premium Notes', href: '/paid-notes', icon: '💎' },
    { label: 'Feedback', href: '/feedback', icon: '💬' },
  ];

  const handleCloseMobileMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowMobileMenu(false);
      setIsClosing(false);
    }, 300);
  };

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showMobileMenu) {
        handleCloseMobileMenu();
      }
    };

    if (showMobileMenu) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  return (
    <nav className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 shadow-sm">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <Logo 
                className="w-8 h-8" 
                textClassName="text-xl font-bold text-secondary-900 dark:text-white hidden sm:block"
                showText={true}
                color="#2563eb"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="nav-link-inactive"
              >
                {link.label}
              </Link>
            ))}
          </div>


          {/* Auth Buttons - Desktop */}
          <div className="flex items-center md:space-x-3">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`text-secondary-500 hover:text-secondary-600 dark:text-secondary-400 dark:hover:text-secondary-300 p-2 transition-all duration-300 ${showMobileMenu ? 'hamburger-open' : ''}`}
                aria-label="Toggle mobile menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                </div>
              </button>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="primary" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Mobile Navigation Menu */}
        {showMobileMenu && (
          <>
            {/* Backdrop Overlay */}
            <div 
              className={`mobile-nav-overlay ${isClosing ? 'closing' : ''}`}
              onClick={() => handleCloseMobileMenu()}
            />
            
            {/* Sidebar */}
            <div className={`mobile-nav-sidebar ${isClosing ? 'closing' : ''}`}>
              {/* Header */}
              <div className="mobile-nav-header">
                <div className="flex items-center gap-3">
                  <Logo 
                    className="w-8 h-8" 
                    textClassName="text-lg font-bold text-white"
                    showText={true}
                    color="#ffffff"
                  />
                </div>
                <button
                  onClick={() => handleCloseMobileMenu()}
                  className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Content */}
              <div className="mobile-nav-content">
                {/* Navigation Links */}
                <div className="mobile-nav-section">
                  <div className="mobile-nav-section-title">
                    <span>🧭</span>
                    <span>Navigation</span>
                  </div>
                  
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="mobile-nav-item"
                      onClick={() => handleCloseMobileMenu()}
                    >
                      <span className="mobile-nav-item-icon">{link.icon}</span>
                      <span className="mobile-nav-item-text">{link.label}</span>
                    </Link>
                  ))}
                </div>

                {/* Account Section */}
                <div className="mobile-nav-section">
                  <div className="mobile-nav-section-title">
                    <span>🔐</span>
                    <span>Account</span>
                  </div>
                  
                  <Link
                    to="/login"
                    className="mobile-nav-item"
                    onClick={() => handleCloseMobileMenu()}
                  >
                    <span className="mobile-nav-item-icon">🚪</span>
                    <span className="mobile-nav-item-text">Sign In</span>
                  </Link>
                  
                  <Link
                    to="/register"
                    className="mobile-nav-item"
                    onClick={() => handleCloseMobileMenu()}
                  >
                    <span className="mobile-nav-item-icon">✨</span>
                    <span className="mobile-nav-item-text">Get Started</span>
                  </Link>
                </div>
              </div>

              {/* Footer Section */}
              <div className="mobile-nav-user-section">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Welcome to BRS-LMS
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Your Learning Management System
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default PublicHeader;
