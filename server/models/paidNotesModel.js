const mongoose = require('mongoose');

const paidNoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  category: {
    type: String,
    enum: ['Notes', 'Ebook', 'Question Paper', 'Study Guide', 'Other'], // Recommended: Uncomment and define specific categories
    default: 'Notes' // Recommended: Uncomment and set a default category
  },
  price: {
    type: Number,
    required: true
  },
  fileUrl: { // For external file URLs (e.g., cloud storage)
    type: String,
    required: false
  },
  file: { // For internal file paths (e.g., uploaded to your server)
    type: String,
    required: false
  },
  uploadedBy: { // Recommended: Track who uploaded the note
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  salesCount: {
    type: Number,
    default: 0
  },
  isActive: { // Recommended: Allows deactivating notes without deleting
    type: Boolean,
    default: true
  }
});

const paidNotes = mongoose.model('paid_note', paidNoteSchema);
module.exports = paidNotes;
