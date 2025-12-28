import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Clear errors when user starts typing
  useEffect(() => {
    if (errors.username && formData.username) {
      setErrors(prev => ({ ...prev, username: '' }));
    }
    if (errors.password && formData.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  }, [formData.username, formData.password, errors]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 3) {
      newErrors.password = 'Password must be at least 3 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('LoginPage: Form submission started');
    
    if (!validateForm()) {
      console.log('LoginPage: Form validation failed');
      return;
    }
    
    console.log('LoginPage: Form validation passed, attempting login');
    setLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      console.log('LoginPage: Calling login function with credentials:', {
        username: formData.username,
        passwordLength: formData.password?.length
      });
      
      const success = await login(formData);
      console.log('LoginPage: Login function returned:', success);
      
      if (success) {
        console.log('LoginPage: Login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('LoginPage: Login failed');
        // Additional error handling can be added here if needed
      }
    } catch (error) {
      console.error('LoginPage: Unexpected error during login:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      console.log('LoginPage: Setting loading to false');
      setLoading(false);
    }
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 safe-top safe-bottom">
      {/* Header - Mobile Optimized */}
      <div className="bg-white/80 dark:bg-secondary-900/80 backdrop-blur-md border-b border-secondary-200/50 dark:border-secondary-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="text-lg sm:text-xl font-bold font-display text-primary-600 dark:text-primary-400">
              🎓 LMS Portal
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 transition-colors duration-200 text-xs sm:text-sm flex items-center min-h-[44px] px-2 sm:px-3 rounded-lg touch-manipulation"
              aria-label="Back to Home"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden xs:inline">Back to Home</span>
              <span className="xs:hidden">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-20">
        <div className="max-w-md mx-auto">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-soft">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-secondary-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 px-2">
              Sign in to access your learning dashboard
            </p>
          </div>

          {/* Login Form Card */}
          <div className="card animate-slide-up">
            <div className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* General Error Display */}
                {errors.general && (
                  <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3">
                    <p className="text-sm text-error-600 dark:text-error-400 flex items-center">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.general}
                    </p>
                  </div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <label 
                    htmlFor="username" 
                    className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg 
                        className={`h-5 w-5 transition-colors duration-200 ${
                          focusedField === 'username' 
                            ? 'text-primary-500' 
                            : 'text-secondary-400'
                        }`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      autoComplete="username"
                      className={`block w-full pl-10 pr-3 py-3 sm:py-3.5 border rounded-xl shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm sm:text-base min-h-[48px] touch-manipulation ${
                        errors.username 
                          ? 'border-error-300 focus:ring-error-500 focus:border-error-500 bg-error-50 dark:bg-error-900/20' 
                          : 'border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800'
                      } dark:text-white dark:placeholder-secondary-500`}
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => handleFocus('username')}
                      onBlur={handleBlur}
                      disabled={loading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs sm:text-sm text-error-600 dark:text-error-400 flex items-center animate-fade-in">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg 
                        className={`h-5 w-5 transition-colors duration-200 ${
                          focusedField === 'password' 
                            ? 'text-primary-500' 
                            : 'text-secondary-400'
                        }`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      className={`block w-full pl-10 pr-12 py-3 sm:py-3.5 border rounded-xl shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm sm:text-base min-h-[48px] touch-manipulation ${
                        errors.password 
                          ? 'border-error-300 focus:ring-error-500 focus:border-error-500 bg-error-50 dark:bg-error-900/20' 
                          : 'border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800'
                      } dark:text-white dark:placeholder-secondary-500`}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => handleFocus('password')}
                      onBlur={handleBlur}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[44px] min-w-[44px] justify-center touch-manipulation"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-secondary-400 hover:text-secondary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-secondary-400 hover:text-secondary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs sm:text-sm text-error-600 dark:text-error-400 flex items-center animate-fade-in">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full min-h-[48px] sm:min-h-[52px] text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </div>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-secondary-200 dark:border-secondary-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-2 bg-white dark:bg-secondary-800 text-secondary-500 dark:text-secondary-400">
                      New to LMS Portal?
                    </span>
                  </div>
                </div>

                {/* Register Link */}
                <Link
                  to="/register"
                  className="btn-outline w-full min-h-[44px] sm:min-h-[48px] text-sm sm:text-base font-medium touch-manipulation transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create New Account
                </Link>
              </form>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 sm:mt-6 text-center animate-slide-up">
            <div className="inline-flex items-center text-xs sm:text-sm text-secondary-500 dark:text-secondary-400 px-2">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-center">Your data is secure and encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
