const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { getProcessedImages, deleteImage } = require('../controllers/imageController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/frames'),
  filename: (req, file, cb) => cb(null, 'frame.png') // overwrite previous frame
});
const upload = multer({ storage });

// Frame upload route
router.post('/upload-frame', upload.single('frame'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  res.json({ message: 'Frame uploaded successfully!' });
});

// Other admin routes...
router.get('/images', getProcessedImages);
router.delete('/images/:photoId', deleteImage);

module.exports = router;
