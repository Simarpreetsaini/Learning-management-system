import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { validateEmail, paidNotesApi } from '../../api/paidNotesApi';
import { Mail } from 'lucide-react';

const PaymentForm = ({ amount, noteId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validate email
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');

    setIsProcessing(true);

    try {
      // Initiate purchase
      const response = await paidNotesApi.initiatePurchase(noteId, email);
      const { clientSecret, orderId } = response.data;

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            email: email,
          },
        },
      });

      if (error) {
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Fetch real download information after successful payment
        try {
          const downloadResponse = await paidNotesApi.getDownloadUrl(orderId);
          if (downloadResponse.success && downloadResponse.data.downloadUrl) {
            onSuccess({
              orderId: downloadResponse.data.orderId,
              downloadUrl: downloadResponse.data.downloadUrl,
              noteTitle: downloadResponse.data.noteTitle,
              isExpired: downloadResponse.data.isExpired,
              downloadExpiry: downloadResponse.data.downloadExpiry
            });
          } else {
            onError('Payment successful but download information is not ready yet. Please try again in a moment.');
          }
        } catch (downloadError) {
          console.error('Error fetching download information:', downloadError);
          onError('Payment successful but failed to retrieve download information. Please contact support.');
        }
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Email Input - Mobile Optimized */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-2 text-sm sm:text-base border ${
              emailError ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-secondary-700 dark:text-white touch-manipulation`}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
          />
        </div>
        {emailError && (
          <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{emailError}</p>
        )}
      </div>

      {/* Card Element - Mobile Optimized */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Card Details
        </label>
        <div className="p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-secondary-700">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                  iconColor: '#666EE8',
                },
                invalid: {
                  color: '#9e2146',
                  iconColor: '#9e2146',
                },
                complete: {
                  color: '#424770',
                  iconColor: '#666EE8',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Enter your card number, expiry date, and CVC
        </p>
      </div>

      {/* Amount Display - Mobile Optimized */}
      <div className="bg-gray-50 dark:bg-secondary-700 px-3 sm:px-4 py-3 sm:py-4 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount:</span>
          <span className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            ₹{amount.toFixed(2)}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure payment processed by Stripe
          </p>
        </div>
      </div>

      {/* Submit Button - Mobile Optimized */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full btn-mobile flex justify-center items-center py-3 sm:py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white transition-all duration-200 ${
          isProcessing || !stripe
            ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed opacity-75'
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95'
        }`}
      >
        {isProcessing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Pay Securely</span>
          </>
        )}
      </button>

      {/* Security Notice - Mobile Optimized */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <div className="flex items-start">
          <svg className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <p className="text-xs sm:text-sm text-green-800 dark:text-green-200 font-medium">
              Secure Payment
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Your payment is protected by Stripe's industry-leading security. We never store your card details.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;
