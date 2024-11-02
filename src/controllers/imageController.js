const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');

// Define an in-memory storage to keep track of processed photos
const photoQueue = {};

// Function to upload image, process it, and generate QR code
exports.uploadImage = async (req, res) => {
  const { image } = req.body;
  const photoId = Date.now().toString();
  const downloadLink = `http://localhost:3000/download.html?photoId=${photoId}`;

  try {
    const processedImagePath = await saveProcessedImage(image, photoId);
    photoQueue[photoId] = { status: 'ready', imagePath: processedImagePath };

    const qrFilePath = `public/qrcodes/${photoId}.png`;
    await QRCode.toFile(qrFilePath, downloadLink);

    res.status(200).json({ qrCodeUrl: `/qrcodes/${photoId}.png`, downloadLink });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Failed to process image.' });
  }
};

// Function to get image details for download page
exports.getImage = (req, res) => {
  const { photoId } = req.params;
  const photo = photoQueue[photoId];

  if (photo && photo.status === 'ready') {
    res.json({ imagePath: `/processed/${photoId}.png` });
  } else {
    res.status(404).json({ message: 'Photo not found or still processing.' });
  }
};

// Function to get all processed images for the admin panel
exports.getProcessedImages = (req, res) => {
  const images = Object.keys(photoQueue)
    .filter(photoId => photoQueue[photoId].status === 'ready')
    .map(photoId => ({
      id: photoId,
      downloadLink: `/photos/${photoId}`,
      imagePath: photoQueue[photoId].imagePath
    }));
  res.json(images);
};

// Function to delete an image
exports.deleteImage = (req, res) => {
  const { photoId } = req.params;
  const photo = photoQueue[photoId];

  if (photo && photo.status === 'ready') {
    fs.unlink(photo.imagePath, (err) => {
      if (err) {
        console.error('Error deleting image:', err);
        return res.status(500).json({ message: 'Failed to delete image.' });
      }
      delete photoQueue[photoId];
      res.json({ message: 'Image deleted successfully.' });
    });
  } else {
    res.status(404).json({ message: 'Image not found.' });
  }
};

// Helper function to process and save the image
async function saveProcessedImage(base64Image, photoId) {
  const buffer = Buffer.from(base64Image.split(',')[1], 'base64');
  const originalImagePath = `public/images/${photoId}.png`;
  fs.writeFileSync(originalImagePath, buffer);

  const image = await loadImage(originalImagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, image.width, image.height);
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 20;
  ctx.strokeRect(0, 0, image.width, image.height);

  const processedImagePath = `public/processed/${photoId}.png`;
  fs.writeFileSync(processedImagePath, canvas.toBuffer('image/png'));

  return processedImagePath;
}
