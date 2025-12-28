const PaidNote = require('../models/paidNotesModel');
const Order = require('../models/orderModel');
const mongoose = require('mongoose');
const stripeService = require('../services/stripeService');
const crypto = require('crypto');
const {
  uploadToCloudStorage,
  generateDownloadLink
} = require('../services/fileservice');
const {
  sendDownloadLinkEmail
} = require('../services/emailService');
const { notifyStudentsOnTeacherUpload } = require('../services/notificationService');

// Get all paid notes
const getNotes = async (req, res) => {
  try {
    const { category, subject, search } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const notes = await PaidNote.find(query)
      .populate('subject', 'name code department semester')
      .populate('uploadedBy', 'name email')
      .sort({ uploadDate: -1 });

    res.status(200).json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes'
    });
  }
};

// Get single note by ID
const getNoteById = async (req, res) => {
  try {
    const note = await PaidNote.findById(req.params.id)
      .populate('subject', 'name code department semester')
      .populate('uploadedBy', 'name email');
    
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note'
    });
  }
};

// Initiate purchase
const initiatePurchase = async (req, res) => {
  try {
    const { buyerEmail } = req.body;
    const noteId = req.params.id;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const note = await PaidNote.findById(noteId);
    if (!note || !note.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Note not found or not available'
      });
    }

    // Check if Stripe is configured
    if (!stripeService.isConfigured()) {
      console.error('Stripe configuration missing:', stripeService.getConfigurationStatus());
      return res.status(500).json({
        success: false,
        error: 'Payment system not configured. Please contact administrator.'
      });
    }

    // Create order first
    const order = new Order({
      buyerEmail,
      noteId: note._id,
      noteTitle: note.title,
      price: note.price,
      paymentStatus: 'Pending'
    });

    await order.save();

    try {
      // Create Stripe PaymentIntent
      const paymentIntent = await stripeService.createPaymentIntent(
        note.price,
        'inr',
        {
          orderId: order._id.toString(),
          noteId: note._id.toString(),
          noteTitle: note.title,
          buyerEmail: buyerEmail
        }
      );

      // Update order with Stripe PaymentIntent ID
      order.stripePaymentIntentId = paymentIntent.id;
      order.paymentId = paymentIntent.id;
      await order.save();

      res.status(200).json({
        success: true,
        data: {
          orderId: order._id,
          clientSecret: paymentIntent.client_secret
        }
      });

    } catch (stripeError) {
      // If Stripe fails, clean up the order
      await Order.findByIdAndDelete(order._id);
      throw stripeError;
    }

  } catch (error) {
    console.error('Error initiating purchase:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate purchase'
    });
  }
};

// Handle webhook
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    if (!signature) {
      console.error('Missing Stripe signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(payload, signature);
    console.log('Webhook event received:', event.type);

    // Handle the event
    const result = await stripeService.handleWebhookEvent(event);

    if (result.handled && result.type === 'payment_success') {
      // Update order status and generate access key
      await handlePaymentSuccess(result.paymentIntentId, result.metadata);
    } else if (result.handled && result.type === 'payment_failure') {
      // Update order status for failed payment
      await handlePaymentFailure(result.paymentIntentId, result.metadata);
    }

    res.status(200).json({ received: true, handled: result.handled });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook failed' });
  }
};

// Handle successful payment
const handlePaymentSuccess = async (paymentIntentId, metadata) => {
  try {
    const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
    
    if (!order) {
      console.error('Order not found for PaymentIntent:', paymentIntentId);
      return;
    }

    if (order.paymentStatus === 'Completed') {
      console.log('Order already processed:', order._id);
      return;
    }

    // Generate access key and set download expiry
    const accessKey = crypto.randomBytes(32).toString('hex');
    const downloadExpiry = new Date();
    downloadExpiry.setHours(downloadExpiry.getHours() + 24); // 24 hours access

    // Update order
    order.paymentStatus = 'Completed';
    order.accessKey = accessKey;
    order.downloadExpiry = downloadExpiry;
    order.transactionDetails = metadata;
    
    await order.save();

    // Send download link email
    try {
      const downloadUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/download/${order._id}/${accessKey}`;
      await sendDownloadLinkEmail(order.buyerEmail, {
        noteTitle: order.noteTitle,
        downloadUrl: downloadUrl,
        expiryTime: downloadExpiry
      });
      console.log('Download link email sent to:', order.buyerEmail);
    } catch (emailError) {
      console.error('Failed to send download email:', emailError);
      // Don't fail the payment processing if email fails
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
};

// Handle failed payment
const handlePaymentFailure = async (paymentIntentId, metadata) => {
  try {
    const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
    
    if (!order) {
      console.error('Order not found for failed PaymentIntent:', paymentIntentId);
      return;
    }

    order.paymentStatus = 'Failed';
    order.transactionDetails = metadata;
    await order.save();

    console.log('Payment failed for order:', order._id);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
};

// Download note - return signed AWS URL directly
const downloadNote = async (req, res) => {
  try {
    const { orderId, accessKey } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      accessKey,
      paymentStatus: 'Completed'
    }).populate('noteId');

    if (!order) {
      return res.status(403).json({
        success: false,
        error: 'Download not authorized'
      });
    }

    // Check if download link is still valid
    const now = new Date();
    const isExpired = order.downloadExpiry && now > order.downloadExpiry;

    if (isExpired) {
      return res.status(410).json({
        success: false,
        error: 'Download link has expired'
      });
    }

    // Generate signed AWS URL and return it directly
    const signedUrl = await generateDownloadLink(order.noteId);
    
    res.status(200).json({
      success: true,
      data: {
        downloadUrl: signedUrl,
        noteTitle: order.noteTitle,
        expiresIn: '1 hour'
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Download failed'
    });
  }
};

// Create note (teacher)
const createNote = async (req, res) => {
  try {
    const { title, description, subject, category, price } = req.body;
    const file = req.file;

    if (!title || !price || !file) {
      return res.status(400).json({
        success: false,
        error: 'Title, price, and file are required'
      });
    }

    const fileUrl = await uploadToCloudStorage(file);

    const note = new PaidNote({
      title,
      description,
      subject,
      category,
      price,
      fileUrl,
      uploadedBy: req.user._id
    });

    await note.save();

    // Notify students about the new paid note if user is a teacher
    if (req.user && req.user.role === 'Teacher') {
      try {
        await notifyStudentsOnTeacherUpload(req.user._id, 'paid_note', {
          _id: note._id,
          title: note.title,
          subject: note.subject,
          category: note.category,
          price: note.price
        });
      } catch (notificationError) {
        console.error('Error creating notifications for paid note:', notificationError);
        // Don't fail the main operation if notification fails
      }
    }

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note'
    });
  }
};

// Get teacher notes
const getTeacherNotes = async (req, res) => {
  try {
    const notes = await PaidNote.find({ uploadedBy: req.user._id });
    
    res.status(200).json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching teacher notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes'
    });
  }
};

// Update note
const updateNote = async (req, res) => {
  try {
    const note = await PaidNote.findOneAndUpdate(
      { _id: req.params.id, uploadedBy: req.user._id },
      req.body,
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note'
    });
  }
};

// Delete note
const deactivateNote = async (req, res) => {
  try {
    const note = await PaidNote.findOneAndUpdate(
      { _id: req.params.id, uploadedBy: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Note deactivated'
    });
  } catch (error) {
    console.error('Error deactivating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate note'
    });
  }
};

// Toggle note status
const toggleNoteStatus = async (req, res) => {
  try {
    const note = await PaidNote.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    note.isActive = !note.isActive;
    await note.save();

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error toggling note status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle note status'
    });
  }
};

// Get payment success details
const getPaymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.params;

    let order = await Order.findOne({
      _id: orderId
    }).populate('noteId');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // If payment is completed but no access key exists, generate one
    // This handles cases where webhook processing might have failed
    if (order.paymentStatus === 'Completed' && !order.accessKey) {
      const accessKey = crypto.randomBytes(32).toString('hex');
      const downloadExpiry = new Date();
      downloadExpiry.setHours(downloadExpiry.getHours() + 24); // 24 hours access

      order.accessKey = accessKey;
      order.downloadExpiry = downloadExpiry;
      await order.save();
    }

    // For testing purposes, if order exists but payment is still pending,
    // simulate successful payment (this should be removed in production)
    if (order.paymentStatus === 'Pending' && process.env.NODE_ENV !== 'production') {
      console.log('Simulating payment success for testing purposes');
      const accessKey = crypto.randomBytes(32).toString('hex');
      const downloadExpiry = new Date();
      downloadExpiry.setHours(downloadExpiry.getHours() + 24);

      order.paymentStatus = 'Completed';
      order.accessKey = accessKey;
      order.downloadExpiry = downloadExpiry;
      await order.save();
    }

    if (order.paymentStatus !== 'Completed') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed yet'
      });
    }

    // Check if download link is still valid
    const now = new Date();
    const isExpired = order.downloadExpiry && now > order.downloadExpiry;

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        noteTitle: order.noteTitle,
        price: order.price,
        downloadUrl: isExpired ? null : `/api/paid-notes/download/${order._id}/${order.accessKey}`,
        isExpired: isExpired,
        downloadExpiry: order.downloadExpiry,
        orderDate: order.orderDate
      }
    });

  } catch (error) {
    console.error('Error fetching payment success details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment details'
    });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  initiatePurchase,
  handleWebhook,
  downloadNote,
  getPaymentSuccess,
  createNote,
  getTeacherNotes,
  updateNote,
  deactivateNote,
  toggleNoteStatus
};
