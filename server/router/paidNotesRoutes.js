const express = require('express');
const router = express.Router();
const authenticateTeacher = require('../middlewares/authenticateTeacher');
const { documentUpload } = require('../middlewares/multerConfig');
const {
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
} = require('../controllers/paidNotesController');

// Public routes
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/:id/initiate-purchase', initiatePurchase);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/download/:orderId/:accessKey', downloadNote);
router.get('/payment-success/:orderId', getPaymentSuccess);

// Teacher routes
router.post('/', authenticateTeacher, documentUpload.single('file'), createNote);
router.get('/teacher/my-notes', authenticateTeacher, getTeacherNotes);
router.put('/:id', authenticateTeacher, documentUpload.single('file'), updateNote);
router.delete('/:id', authenticateTeacher, deactivateNote);
router.patch('/:id/toggle-status', authenticateTeacher, toggleNoteStatus);

module.exports = router;
