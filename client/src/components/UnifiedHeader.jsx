import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Logo from './Logo';
import NotificationBell from './notifications/NotificationBell';

const UnifiedHeader = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for dropdown menus
  const [showTeachingDropdown, setShowTeachingDropdown] = useState(false);
  const [showResourcesDropdown, setShowResourcesDropdown] = useState(false);
  const [showAcademicDropdown, setShowAcademicDropdown] = useState(false);
  const [showManagementDropdown, setShowManagementDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Refs for dropdown menus
  const teachingRef = useRef(null);
  const resourcesRef = useRef(null);
  const academicRef = useRef(null);
  const managementRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    return `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-700 text-white'
        : 'text-blue-100 hover:text-white hover:bg-blue-700'
    }`;
  };

  const dropdownButtonClass = `px-3 py-2 rounded-md text-sm font-medium transition-colors text-blue-100 hover:text-white hover:bg-blue-700 flex items-center`;

  const dropdownItemClass = `block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors`;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (teachingRef.current && !teachingRef.current.contains(event.target)) {
        setShowTeachingDropdown(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(event.target)) {
        setShowResourcesDropdown(false);
      }
      if (academicRef.current && !academicRef.current.contains(event.target)) {
        setShowAcademicDropdown(false);
      }
      if (managementRef.current && !managementRef.current.contains(event.target)) {
        setShowManagementDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const DropdownIcon = () => (
    <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center">
            <Link to={user ? "/dashboard" : "/"} className="flex-shrink-0">
              <Logo 
                className="w-8 h-8" 
                textClassName="text-xl font-bold text-white hidden sm:block"
                showText={true}
                color="#ffffff"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-10 lg:flex lg:items-baseline lg:space-x-1">
              {/* Admin gets Dashboard and Management options as direct links */}
              {user?.role === 'Admin' ? (
                <>
                  <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                    Dashboard
                  </Link>
                  <Link to="/admin/bulk-import" className={navLinkClass('/admin/bulk-import')}>
                    Bulk User Import
                  </Link>
                  <Link to="/admin/users" className={navLinkClass('/admin/users')}>
                    User Management
                  </Link>
                  <Link to="/departments" className={navLinkClass('/departments')}>
                    Departments
                  </Link>
                  <Link to="/semesters" className={navLinkClass('/semesters')}>
                    Semesters
                  </Link>
                  <Link to="/subjects" className={navLinkClass('/subjects')}>
                    Subjects
                  </Link>
                </>
              ) : (
                <>
                  {/* Dashboard - First option for authenticated non-admin users */}
                  {user && (
                    <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                      Dashboard
                    </Link>
                  )}

                  {/* Common Links (Available to all non-admin) */}
                  <Link to="/noticeboard" className={navLinkClass('/noticeboard')}>
                    {user ? 'Noticeboard' : 'Public Notices'}
                  </Link>
                  
                  {/* Public links only for non-authenticated users */}
                  {!user && (
                    <>
                      <Link to="/public-pyqs" className={navLinkClass('/public-pyqs')}>
                        Previous Year Questions
                      </Link>
                      <Link to="/paid-notes" className={navLinkClass('/paid-notes')}>
                        Paid Notes
                      </Link>
                    </>
                  )}
                  
                  {/* Authenticated users get paid notes access */}
                  {user && (
                    <Link to="/paid-notes" className={navLinkClass('/paid-notes')}>
                      Paid Notes
                    </Link>
                  )}

                  {/* Authenticated User Links (Non-Admin) */}
                  {user && (
                    <>
                      {/* Academic Dropdown - For Students and Teachers */}
                      <div className="relative" ref={academicRef}>
                        <button
                          onClick={() => {
                            setShowAcademicDropdown(!showAcademicDropdown);
                            setShowTeachingDropdown(false);
                            setShowResourcesDropdown(false);
                            setShowManagementDropdown(false);
                          }}
                          className={dropdownButtonClass}
                        >
                          Academic
                          <DropdownIcon />
                        </button>
                        
                        {showAcademicDropdown && (
                          <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1" role="menu">
                              <Link
                                to="/assignments"
                                className={dropdownItemClass}
                                onClick={() => setShowAcademicDropdown(false)}
                              >
                                📝 Assignments
                              </Link>
                              <Link
                                to="/tests"
                                className={dropdownItemClass}
                                onClick={() => setShowAcademicDropdown(false)}
                              >
                                📋 Online Tests
                              </Link>
                              <Link
                                to="/attendance"
                                className={dropdownItemClass}
                                onClick={() => setShowAcademicDropdown(false)}
                              >
                                📅 Attendance
                              </Link>
                              {user.role === 'Student' && (
                                <>
                                  <Link
                                    to="/academic-details"
                                    className={dropdownItemClass}
                                    onClick={() => setShowAcademicDropdown(false)}
                                  >
                                    🎓 Academic Details
                                  </Link>
                                  <Link
                                    to="/student/academic-marks"
                                    className={dropdownItemClass}
                                    onClick={() => setShowAcademicDropdown(false)}
                                  >
                                    📊 My Marks
                                  </Link>
                                </>
                              )}
                              {user.role === 'Teacher' && (
                                <Link
                                  to="/teacher/academic-marks"
                                  className={dropdownItemClass}
                                  onClick={() => setShowAcademicDropdown(false)}
                                >
                                  📊 Academic Marks
                                </Link>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Teaching Tools - Only for Teachers */}
                      {user.role === 'Teacher' && (
                        <div className="relative" ref={teachingRef}>
                          <button
                            onClick={() => {
                              setShowTeachingDropdown(!showTeachingDropdown);
                              setShowAcademicDropdown(false);
                              setShowResourcesDropdown(false);
                              setShowManagementDropdown(false);
                            }}
                            className={dropdownButtonClass}
                          >
                            Teaching
                            <DropdownIcon />
                          </button>
                          
                          {showTeachingDropdown && (
                            <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                              <div className="py-1" role="menu">
                                <Link
                                  to="/teacher/paid-notes"
                                  className={dropdownItemClass}
                                  onClick={() => setShowTeachingDropdown(false)}
                                >
                                  📝 My Notes
                                </Link>
                                <Link
                                  to="/teacher/student-management"
                                  className={dropdownItemClass}
                                  onClick={() => setShowTeachingDropdown(false)}
                                >
                                  👥 Student Management
                                </Link>
                                <Link
                                  to="/teacher/feedback"
                                  className={dropdownItemClass}
                                  onClick={() => setShowTeachingDropdown(false)}
                                >
                                  💬 Feedback Management
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resources Dropdown - For all non-admin users */}
                      <div className="relative" ref={resourcesRef}>
                        <button
                          onClick={() => {
                            setShowResourcesDropdown(!showResourcesDropdown);
                            setShowTeachingDropdown(false);
                            setShowAcademicDropdown(false);
                            setShowManagementDropdown(false);
                          }}
                          className={dropdownButtonClass}
                        >
                          Resources
                          <DropdownIcon />
                        </button>
                        
                        {showResourcesDropdown && (
                          <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="py-1" role="menu">
                              <Link
                                to="/study-materials"
                                className={dropdownItemClass}
                                onClick={() => setShowResourcesDropdown(false)}
                              >
                                📚 Study Materials
                              </Link>
                              <Link
                                to="/previous-year-questions"
                                className={dropdownItemClass}
                                onClick={() => setShowResourcesDropdown(false)}
                              >
                                📄 Previous Year Questions
                              </Link>
                              <Link
                                to="/e-library"
                                className={dropdownItemClass}
                                onClick={() => setShowResourcesDropdown(false)}
                              >
                                📖 E-Library
                              </Link>
                              <Link
                                to="/important-documents"
                                className={dropdownItemClass}
                                onClick={() => setShowResourcesDropdown(false)}
                              >
                                📋 Important Documents
                              </Link>
                              <Link
                                to="/image-gallery"
                                className={dropdownItemClass}
                                onClick={() => setShowResourcesDropdown(false)}
                              >
                                🖼️ Image Gallery
                              </Link>
                              <Link
                                to="/hot-links"
                                className={dropdownItemClass}
                                onClick={() => setShowResourcesDropdown(false)}
                              >
                                🔗 Important Links
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

          </div>

          {/* Right side - User info or Login/Register */}
          <div className="flex items-center lg:space-x-4">
            {/* Mobile notification bell and menu button */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* Mobile Notification Bell - Only for Teachers and Students */}
              {user && (user.role === 'Teacher' || user.role === 'Student') && (
                <NotificationBell />
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`text-blue-100 hover:text-white p-2 transition-all duration-300 ${showMobileMenu ? 'hamburger-open' : ''}`}
                aria-label="Toggle mobile menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                </div>
              </button>
            </div>

            {/* Desktop user info */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              {user ? (
                <>
                  {/* Notification Bell - Only for Teachers and Students */}
                  {(user.role === 'Teacher' || user.role === 'Student') && (
                    <NotificationBell />
                  )}
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {user.fullname}
                    </div>
                    <div className="text-xs text-blue-200">
                      {user.username}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    user.role === 'Admin' 
                      ? 'bg-red-100 text-red-800'
                      : user.role === 'Teacher'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.role}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="bg-blue-700 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-800 transition-colors"
                  >
                    Login
                  </Link>
                </>
              )}
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
                {/* Admin gets Quick Access and Management sections */}
                {user?.role === 'Admin' ? (
                  <>
                    <div className="mobile-nav-section">
                      <div className="mobile-nav-section-title">
                        <span>⚡</span>
                        <span>Quick Access</span>
                      </div>
                      
                      <Link
                        to="/dashboard"
                        className="mobile-nav-item"
                        onClick={() => handleCloseMobileMenu()}
                      >
                        <span className="mobile-nav-item-icon">🏠</span>
                        <span className="mobile-nav-item-text">Dashboard</span>
                      </Link>
                      
                      <Link
                        to="/admin/bulk-import"
                        className="mobile-nav-item"
                        onClick={() => handleCloseMobileMenu()}
                      >
                        <span className="mobile-nav-item-icon">👥</span>
                        <span className="mobile-nav-item-text">Bulk User Import</span>
                      </Link>
                    </div>

                    <div className="mobile-nav-section">
                      <div className="mobile-nav-section-title">
                        <span>⚙️</span>
                        <span>Management</span>
                      </div>
                      
                      <Link
                        to="/admin/users"
                        className="mobile-nav-item"
                        onClick={() => handleCloseMobileMenu()}
                      >
                        <span className="mobile-nav-item-icon">👤</span>
                        <span className="mobile-nav-item-text">User Management</span>
                      </Link>
                      
                      <Link
                        to="/departments"
                        className="mobile-nav-item"
                        onClick={() => handleCloseMobileMenu()}
                      >
                        <span className="mobile-nav-item-icon">🏢</span>
                        <span className="mobile-nav-item-text">Departments</span>
                      </Link>
                      
                      <Link
                        to="/semesters"
                        className="mobile-nav-item"
                        onClick={() => handleCloseMobileMenu()}
                      >
                        <span className="mobile-nav-item-icon">📅</span>
                        <span className="mobile-nav-item-text">Semesters</span>
                      </Link>
                      
                      <Link
                        to="/subjects"
                        className="mobile-nav-item"
                        onClick={() => handleCloseMobileMenu()}
                      >
                        <span className="mobile-nav-item-icon">📚</span>
                        <span className="mobile-nav-item-text">Subjects</span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Quick Actions for non-admin users */}
                    <div className="mobile-nav-section">
                      <div className="mobile-nav-section-title">
                        <span>⚡</span>
                        <span>Quick Access</span>
                      </div>
                      
                      {user && (
                        <Link
                          to="/dashboard"
                          className="mobile-nav-item"
                          onClick={() => handleCloseMobileMenu()}
                        >
                          <span className="mobile-nav-item-icon">🏠</span>
                          <span className="mobile-nav-item-text">Dashboard</span>
                        </Link>
                      )}


                      <Link
                        to="/noticeboard"
                        className="mobile-nav-item"
                        onClick={() => handleCloseMobileMenu()}
                      >
                        <span className="mobile-nav-item-icon">📢</span>
                        <span className="mobile-nav-item-text">
                          {user ? 'Noticeboard' : 'Public Notices'}
                        </span>
                      </Link>

                      {!user && (
                        <>
                          <Link
                            to="/public-pyqs"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">📄</span>
                            <span className="mobile-nav-item-text">PYQs</span>
                          </Link>
                          <Link
                            to="/paid-notes"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">💎</span>
                            <span className="mobile-nav-item-text">Premium Notes</span>
                          </Link>
                        </>
                      )}

                      {user && (
                        <Link
                          to="/paid-notes"
                          className="mobile-nav-item"
                          onClick={() => handleCloseMobileMenu()}
                        >
                          <span className="mobile-nav-item-icon">💎</span>
                          <span className="mobile-nav-item-text">Premium Notes</span>
                        </Link>
                      )}
                    </div>

                    {user && (
                      <>
                        {/* Academic Section for non-admin users */}
                        <div className="mobile-nav-section">
                          <div className="mobile-nav-section-title">
                            <span>📚</span>
                            <span>Academic</span>
                          </div>
                          
                          <Link
                            to="/assignments"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">📝</span>
                            <span className="mobile-nav-item-text">Assignments</span>
                          </Link>
                          
                          <Link
                            to="/tests"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">📋</span>
                            <span className="mobile-nav-item-text">Online Tests</span>
                          </Link>
                          
                          <Link
                            to="/attendance"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">📅</span>
                            <span className="mobile-nav-item-text">Attendance</span>
                          </Link>

                          {user.role === 'Student' && (
                            <>
                              <Link
                                to="/academic-details"
                                className="mobile-nav-item"
                                onClick={() => handleCloseMobileMenu()}
                              >
                                <span className="mobile-nav-item-icon">🎓</span>
                                <span className="mobile-nav-item-text">Academic Details</span>
                              </Link>
                              <Link
                                to="/student/academic-marks"
                                className="mobile-nav-item"
                                onClick={() => handleCloseMobileMenu()}
                              >
                                <span className="mobile-nav-item-icon">📊</span>
                                <span className="mobile-nav-item-text">My Marks</span>
                              </Link>
                            </>
                          )}

                          {user.role === 'Teacher' && (
                            <Link
                              to="/teacher/academic-marks"
                              className="mobile-nav-item"
                              onClick={() => handleCloseMobileMenu()}
                            >
                              <span className="mobile-nav-item-icon">📊</span>
                              <span className="mobile-nav-item-text">Academic Marks</span>
                            </Link>
                          )}
                        </div>

                        {/* Resources Section for non-admin users */}
                        <div className="mobile-nav-section">
                          <div className="mobile-nav-section-title">
                            <span>📖</span>
                            <span>Resources</span>
                          </div>
                          
                          <Link
                            to="/study-materials"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">📚</span>
                            <span className="mobile-nav-item-text">Study Materials</span>
                          </Link>
                          
                          <Link
                            to="/previous-year-questions"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">📄</span>
                            <span className="mobile-nav-item-text">PYQs</span>
                          </Link>
                          
                          <Link
                            to="/e-library"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">📖</span>
                            <span className="mobile-nav-item-text">E-Library</span>
                          </Link>
                          
                          <Link
                            to="/important-documents"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">📋</span>
                            <span className="mobile-nav-item-text">Documents</span>
                          </Link>
                          
                          <Link
                            to="/image-gallery"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">🖼️</span>
                            <span className="mobile-nav-item-text">Gallery</span>
                          </Link>
                          
                          <Link
                            to="/hot-links"
                            className="mobile-nav-item"
                            onClick={() => handleCloseMobileMenu()}
                          >
                            <span className="mobile-nav-item-icon">🔗</span>
                            <span className="mobile-nav-item-text">Important Links</span>
                          </Link>
                        </div>

                        {/* Teaching Tools - Only for Teachers */}
                        {user.role === 'Teacher' && (
                          <div className="mobile-nav-section">
                            <div className="mobile-nav-section-title">
                              <span>👨‍🏫</span>
                              <span>Teaching Tools</span>
                            </div>
                            
                            <Link
                              to="/teacher/paid-notes"
                              className="mobile-nav-item"
                              onClick={() => handleCloseMobileMenu()}
                            >
                              <span className="mobile-nav-item-icon">📝</span>
                              <span className="mobile-nav-item-text">My Notes</span>
                            </Link>
                            
                            <Link
                              to="/teacher/student-management"
                              className="mobile-nav-item"
                              onClick={() => handleCloseMobileMenu()}
                            >
                              <span className="mobile-nav-item-icon">👥</span>
                              <span className="mobile-nav-item-text">Students</span>
                            </Link>
                            
                            <Link
                              to="/teacher/feedback"
                              className="mobile-nav-item"
                              onClick={() => handleCloseMobileMenu()}
                            >
                              <span className="mobile-nav-item-icon">💬</span>
                              <span className="mobile-nav-item-text">Feedback</span>
                            </Link>
                          </div>
                        )}
                      </>
                    )}

                    {/* Login for Mobile (when not authenticated) */}
                    {!user && (
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
                          <span className="mobile-nav-item-text">Login</span>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* User Section for Mobile */}
              {user && (
                <div className="mobile-nav-user-section">
                  <div className="mobile-nav-user-info">
                    <div className="mobile-nav-user-avatar">
                      {user.fullname?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="mobile-nav-user-details">
                      <div className="mobile-nav-user-name">{user.fullname}</div>
                      <div className="mobile-nav-user-role">{user.username} • {user.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      handleCloseMobileMenu();
                    }}
                    className="mobile-nav-logout"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default UnifiedHeader;
