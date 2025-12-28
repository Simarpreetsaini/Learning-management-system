import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe only if the key is available
let stripePromise = null;
if (stripePublishableKey) {
  stripePromise = loadStripe(stripePublishableKey);
} else {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}

// Default appearance for Stripe Elements
const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#2563eb',
    colorBackground: '#ffffff',
    colorText: '#1f2937',
    colorDanger: '#dc2626',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    spacingUnit: '4px',
    borderRadius: '4px',
  },
};

const StripeProvider = ({ children }) => {
  // If Stripe is not configured, show error message
  if (!stripePublishableKey) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium mb-2">Payment System Not Configured</h3>
        <p className="text-red-700 text-sm">
          Stripe payment system is not properly configured. Please contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ appearance }}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
