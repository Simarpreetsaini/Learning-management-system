const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { imageUpload } = require('../middlewares/multerConfig');
const {
    createImage,
    getAllImages,
    getImageById,
    updateImage,
    deleteImage,
    getImagesByCategory,
    searchImages,
    getImageStats,
    serveImage
} = require('../controllers/imageGalleryController');

// Public routes (no authentication required)
router.get('/', getAllImages);
router.get('/search', searchImages);
router.get('/stats', getImageStats);
router.get('/category/:category', getImagesByCategory);
router.get('/:id/serve', serveImage); // New route for serving images
router.get('/:id', getImageById);

// Protected routes (authentication required)
router.post('/', authMiddleware, imageUpload.single('imageFile'), createImage);
router.put('/:id', authMiddleware, updateImage);
router.delete('/:id', authMiddleware, deleteImage);

module.exports = router;
