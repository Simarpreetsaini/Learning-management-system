import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';

const PinEntryPage = () => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  
  // The secret PIN - you can change this to whatever you want
  const SECRET_PIN = '6284';

  const handlePinChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle Enter key to submit
    if (e.key === 'Enter' && pin.every(digit => digit !== '')) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const enteredPin = pin.join('');
    
    if (enteredPin.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    // Prevent double submission using ref
    if (isLoading || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    // Simulate loading for better UX (reduced time for mobile)
    setTimeout(() => {
      if (enteredPin === SECRET_PIN) {
        toast.success('Access granted! 🎉');
        // Set session storage to validate access with timestamp
        sessionStorage.setItem('pinValidated', Date.now().toString());
        // Navigate with state to pass validation
        navigate('/register/form', { 
          state: { pinValidated: true },
          replace: true 
        });
      } else {
        toast.error('Invalid PIN! Access denied 🚫');
        setIsShaking(true);
        setPin(['', '', '', '']);
        isSubmittingRef.current = false; // Reset submission state on error
        setIsLoading(false); // Reset loading state on error
        // Focus first input
        inputRefs.current[0]?.focus();
        
        // Remove shake animation after 500ms
        setTimeout(() => setIsShaking(false), 500);
        return; // Early return to prevent setting isLoading to false again
      }
      setIsLoading(false);
    }, 600); // Reduced from 800ms for better mobile UX
  };

  // Auto-submit when all 4 digits are entered (faster for mobile)
  useEffect(() => {
    if (pin.every(digit => digit !== '') && !isLoading && !isSubmittingRef.current) {
      // Reduced delay for mobile responsiveness
      setTimeout(() => {
        handleSubmit();
      }, 200);
    }
  }, [pin, isLoading]);

  const handleReset = () => {
    setPin(['', '', '', '']);
    isSubmittingRef.current = false; // Reset submission state
    inputRefs.current[0]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData.length === 4) {
      const newPin = pastedData.split('');
      setPin(newPin);
      inputRefs.current[3]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 safe-top safe-bottom">
      {/* Header - Mobile Optimized */}
      <div className="bg-primary-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="text-lg sm:text-xl font-bold text-white">
              🎓 LMS Portal
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-primary-100 hover:text-white transition-colors duration-200 text-xs sm:text-sm flex items-center min-h-[44px] px-2 sm:px-3 rounded-lg touch-manipulation"
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

      {/* Main Content - Enhanced Mobile Layout */}
      <div className="px-3 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-20">
        <div className="max-w-sm sm:max-w-md mx-auto">
          {/* Header Section - Mobile Optimized */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-100 dark:bg-primary-900 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-soft">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-secondary-900 dark:text-white mb-2">
              Secure Access
            </h1>
            <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 px-2">
              Enter your 4-digit PIN to access registration
            </p>
          </div>

          {/* PIN Entry Card - Mobile Enhanced */}
          <div className="card animate-slide-up">
            <div className="p-4 sm:p-6">
              {/* PIN Input Grid - Mobile Optimized */}
              <div className={`flex justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 ${isShaking ? 'animate-shake' : ''}`}>
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-200 dark:border-secondary-700 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-secondary-900 transition-all duration-200 touch-manipulation"
                    placeholder="•"
                    autoFocus={index === 0}
                    disabled={isLoading}
                    aria-label={`PIN digit ${index + 1}`}
                  />
                ))}
              </div>

              {/* Auto-submit indicator - Mobile Optimized */}
              {pin.every(digit => digit !== '') && !isLoading && (
                <div className="text-center mb-4 animate-fade-in">
                  <div className="inline-flex items-center text-xs sm:text-sm text-primary-600 dark:text-primary-400">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Auto-submitting...
                  </div>
                </div>
              )}

              {/* Action Buttons - Mobile Enhanced */}
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || isSubmittingRef.current || pin.some(digit => digit === '')}
                  className="btn-primary w-full min-h-[48px] sm:min-h-[52px] text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  aria-label="Submit PIN"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    'Unlock Registration'
                  )}
                </button>

                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="btn-secondary w-full min-h-[44px] sm:min-h-[48px] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  aria-label="Clear PIN"
                >
                  Clear PIN
                </button>
              </div>

              {/* Help Text - Mobile Optimized */}
              <div className="mt-4 sm:mt-6 text-center space-y-2">
                <p className="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400">
                  🔒 Registration is protected for security purposes
                </p>
                <p className="text-xs text-secondary-400 dark:text-secondary-500">
                  PIN will auto-submit when all digits are entered
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info - Mobile Optimized */}
          <div className="mt-4 sm:mt-6 text-center animate-slide-up">
            <div className="inline-flex items-center text-xs sm:text-sm text-secondary-500 dark:text-secondary-400 px-2">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-center">Need help? Contact your administrator</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        /* Enhanced mobile keyboard experience */
        @media (max-width: 640px) {
          /* Ensure inputs are large enough for touch */
          input[inputmode="numeric"] {
            font-size: 1.25rem;
            line-height: 1.75rem;
            min-width: 56px;
            min-height: 56px;
          }
          
          /* Optimize for mobile viewport */
          .card {
            margin: 0 auto;
            border-radius: 1rem;
          }
          
          /* Better spacing on small screens */
          .card-body {
            padding: 1rem;
          }
          
          /* Improve button touch targets */
          button {
            min-height: 44px;
            touch-action: manipulation;
          }
        }

        /* Enhanced focus states for mobile accessibility */
        input:focus {
          transform: scale(1.05);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Loading state improvements */
        input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Better touch feedback */
        button:active {
          transform: scale(0.98);
        }

        /* Landscape orientation support */
        @media (max-height: 500px) and (orientation: landscape) {
          .py-6 {
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
          
          .mb-6 {
            margin-bottom: 1rem;
          }
          
          .w-16, .h-16 {
            width: 3rem;
            height: 3rem;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          input {
            border-width: 3px;
          }
          
          button {
            border-width: 2px;
            border-style: solid;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .animate-shake,
          .animate-fade-in,
          .animate-slide-up {
            animation: none;
          }
          
          input:focus {
            transform: none;
          }
          
          button:active {
            transform: none;
          }
        }

        /* Dark mode enhancements for mobile */
        @media (prefers-color-scheme: dark) {
          input {
            -webkit-appearance: none;
            appearance: none;
          }
        }

        /* iOS Safari specific fixes */
        @supports (-webkit-touch-callout: none) {
          input[inputmode="numeric"] {
            font-size: 16px; /* Prevent zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
};

export default PinEntryPage;
