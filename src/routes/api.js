const express = require('express');
const { uploadImage, getImage } = require('../controllers/imageController');
const router = express.Router();

// Route to upload image and generate QR code
router.post('/upload', uploadImage);

// Route to get processed image details for download page
router.get('/photos/:photoId', getImage);

module.exports = router;
