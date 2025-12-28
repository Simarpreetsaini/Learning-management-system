const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
    createHotLink,
    getAllHotLinks,
    getHotLinkById,
    updateHotLink,
    deleteHotLink,
    searchHotLinks,
    getHotLinksStats
} = require('../controllers/hotLinksController');

// Public routes (no authentication required)
router.get('/', getAllHotLinks);
router.get('/search', searchHotLinks);
router.get('/stats', getHotLinksStats);
router.get('/:id', getHotLinkById);

// Protected routes (authentication required)
router.post('/', authMiddleware, createHotLink);
router.put('/:id', authMiddleware, updateHotLink);
router.delete('/:id', authMiddleware, deleteHotLink);

module.exports = router;
