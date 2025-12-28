const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { documentUpload } = require('../middlewares/multerConfig');
const {
    createDocument,
    getAllDocuments,
    getDocumentById,
    searchDocuments,
    downloadDocument,
    updateDocument,
    deleteDocument,
    getRecentDocuments
} = require('../controllers/impDocController');

// Public routes (no authentication required)
router.get('/', getAllDocuments);
router.get('/search', searchDocuments);
router.get('/recent', getRecentDocuments);
router.get('/:id', getDocumentById);
router.get('/:id/download', downloadDocument);

// Protected routes (authentication required)
router.post('/', authMiddleware, documentUpload.single('impdocument'), createDocument);
router.put('/:id', authMiddleware, documentUpload.single('impdocument'), updateDocument);
router.delete('/:id', authMiddleware, deleteDocument);

module.exports = router;
