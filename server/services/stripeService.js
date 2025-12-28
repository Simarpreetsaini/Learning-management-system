const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  /**
   * Create a PaymentIntent for a purchase
   * @param {number} amount - Amount in smallest currency unit (paise for INR)
   * @param {string} currency - Currency code (default: 'inr')
   * @param {Object} metadata - Additional metadata for the payment
   * @returns {Promise<Object>} PaymentIntent object
   */
  async createPaymentIntent(amount, currency = 'inr', metadata = {}) {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe secret key is not configured');
      }

      // Convert amount to smallest currency unit (paise for INR)
      let amountInPaise = Math.round(amount * 100);

      // Stripe minimum amount requirements (in smallest currency unit)
      const minimumAmounts = {
        'inr': 5000, // 5000 paise = ₹50.00 (Stripe minimum for INR)
        'usd': 50,   // 50 cents = $0.50
        'eur': 50,   // 50 cents = €0.50
      };

      const minimumAmount = minimumAmounts[currency.toLowerCase()] || 50;

      // Ensure minimum amount is met
      if (amountInPaise < minimumAmount) {
        console.warn(`Amount ${amountInPaise} ${currency} is below minimum ${minimumAmount}. Adjusting to minimum amount.`);
        amountInPaise = minimumAmount;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInPaise,
        currency: currency,
        metadata: {
          ...metadata,
          originalAmount: amount.toString(), // Store original amount for reference
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating PaymentIntent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Retrieve a PaymentIntent by ID
   * @param {string} paymentIntentId - The PaymentIntent ID
   * @returns {Promise<Object>} PaymentIntent object
   */
  async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error retrieving PaymentIntent:', error);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Verified event object
   */
  verifyWebhookSignature(payload, signature) {
    try {
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('Stripe webhook secret is not configured');
      }

      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }

  /**
   * Handle webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<Object>} Processing result
   */
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentSuccess(event.data.object);
        
        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailure(event.data.object);
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
          return { handled: false, type: event.type };
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   * @param {Object} paymentIntent - Stripe PaymentIntent object
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentSuccess(paymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id);
    return {
      handled: true,
      type: 'payment_success',
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata
    };
  }

  /**
   * Handle failed payment
   * @param {Object} paymentIntent - Stripe PaymentIntent object
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentFailure(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id);
    return {
      handled: true,
      type: 'payment_failure',
      paymentIntentId: paymentIntent.id,
      metadata: paymentIntent.metadata
    };
  }

  /**
   * Check if Stripe is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  }

  /**
   * Get configuration status details
   * @returns {Object} Configuration details
   */
  getConfigurationStatus() {
    return {
      secretKey: !!process.env.STRIPE_SECRET_KEY,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      isFullyConfigured: this.isConfigured()
    };
  }
}

module.exports = new StripeService();
