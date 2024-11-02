const express = require('express');
const { getProcessedImages, deleteImage } = require('../controllers/imageController');
const router = express.Router();

// Route to get all processed images
router.get('/images', getProcessedImages);

// Route to delete a processed image
router.delete('/images/:photoId', deleteImage);

module.exports = router;
