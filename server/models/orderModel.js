const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // No userId reference needed if no sign-in is required.
  // Instead, we rely on the email provided during checkout.
  buyerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'paid_note',
    required: true
  },
  noteTitle: String, // Denormalized for historical accuracy
  price: Number,     // Denormalized for historical accuracy
  paymentId: String, // Transaction ID from payment gateway
  stripePaymentIntentId: String, // Stripe PaymentIntent ID
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Cancelled'], // Critical for tracking payment state
    default: 'Pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  // Optional: Fields to control download access
  downloadCount: {
    type: Number,
    default: 0
  },
  downloadExpiry: { // e.g., 24 hours after payment completion
    type: Date
  },
  // Recommended: Store a unique token for secure download access
  // This token will be generated after successful payment and sent to the buyerEmail
  accessKey: {
    type: String,
    unique: true,
    sparse: true // Allows null values, useful if not all orders need an access key immediately
  },
  // Recommended: Store payment gateway's full response for debugging/reconciliation
  transactionDetails: mongoose.Schema.Types.Mixed
}, {
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Order', orderSchema);
