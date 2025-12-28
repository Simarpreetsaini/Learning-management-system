const express = require('express');
const router = express.Router();
const { eLibraryUpload } = require('../middlewares/multerConfig');
const {
    createELibItem,
    getAllItems,
    getItemById,
    getItemsByCategory,
    searchItems,
    downloadDocument,
    updateItem,
    deleteItem
} = require('../controllers/eLibController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.post('/', eLibraryUpload.single('impdocument'), createELibItem);
router.get('/', getAllItems);
router.get('/search', searchItems);
router.get('/category/:category', getItemsByCategory);
router.get('/:id', getItemById);
router.get('/:id/download', downloadDocument);
router.put('/:id', eLibraryUpload.single('impdocument'), updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
