const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true,
    minLength: 3,
    maxLength: 100,
  },
  feedback: {
    type: String,
    required: true,
    trim: true,
    minLength: 10,
    maxLength: 1000,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    match: /.+\@.+\..+/,
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    },
  },
  category: {
    type: String,
    enum: ['course', 'platform', 'instructor', 'general'],
    default: 'general',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for guest users
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending',
  },
  adminResponse: {
    type: String,
    required: false,
    maxLength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update `updatedAt` timestamp on save
feedbackSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;