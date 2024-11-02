const express = require('express');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const app = express();
let photoQueue = {};

// Serve the admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
  });

app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));

// Helper function to save and process the image with the correct aspect ratio
async function saveProcessedImage(base64Image, photoId) {
    const buffer = Buffer.from(base64Image.split(',')[1], 'base64');
    const originalImagePath = `public/images/${photoId}.png`;
  
    // Save the original image first
    fs.writeFileSync(originalImagePath, buffer);
  
    // Load the image onto a canvas for processing
    const image = await loadImage(originalImagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, image.width, image.height);
  
    // Add branding (e.g., a border) while preserving aspect ratio
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = Math.min(image.width, image.height) * 0.05; // 5% of the smallest dimension
    ctx.strokeRect(0, 0, image.width, image.height);
  
    // Save the processed image
    const processedImagePath = `public/processed/${photoId}.png`;
    fs.writeFileSync(processedImagePath, canvas.toBuffer('image/png'));
  
    return processedImagePath;
  }  

// Endpoint to handle image upload, QR generation, and processing
app.post('/upload', async (req, res) => {
  const { image } = req.body;
  const photoId = Date.now().toString();

  // Generate a unique download link
  const downloadLink = `http://localhost:3000/photos/${photoId}`;

  try {
    // Process and save the image
    const processedImagePath = await saveProcessedImage(image, photoId);
    photoQueue[photoId] = { status: 'ready', imagePath: processedImagePath };

    // Generate and save the QR code as a static file
    const qrFilePath = `public/qrcodes/${photoId}.png`;
    await QRCode.toFile(qrFilePath, downloadLink);

    // Send the QR code image path and download link to the client
    res.status(200).json({ qrCodeUrl: `/qrcodes/${photoId}.png`, downloadLink });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Failed to process image.' });
  }
});

// Endpoint to display download page with processed image
app.get('/photos/:photoId', (req, res) => {
    const { photoId } = req.params;
    const photo = photoQueue[photoId];
  
    if (photo && photo.status === 'ready') {
      res.send(`
        <html>
          <head><title>Download Your Photo</title></head>
          <body style="text-align:center;">
            <h1>Your photo is ready!</h1>
            <img src="${photo.imagePath}" alt="Processed Photo" style="max-width:80%; border:2px solid #333; margin:20px 0;">
            <p>
              <a href="${photo.imagePath}" download="photo.png">Download</a>
            </p>
            <p>Share on:</p>
            <p>
              <a href="whatsapp://send?text=Check out my photo! ${photo.imagePath}" target="_blank">WhatsApp</a> |
              <a href="https://www.instagram.com/" target="_blank">Instagram</a>
            </p>
            <button onclick="window.location.href='/'">Back to Home</button>
          </body>
        </html>
      `);
    } else {
      res.send('<h3>Your photo is still processing. Please check back in a few seconds.</h3>');
    }
  });

// Endpoint to retrieve a list of processed images for the Admin Panel
app.get('/admin/images', (req, res) => {
    const images = Object.keys(photoQueue)
      .filter(photoId => photoQueue[photoId].status === 'ready')
      .map(photoId => ({
        id: photoId,
        downloadLink: `/photos/${photoId}`,
        imagePath: photoQueue[photoId].imagePath
      }));
  
    res.json(images);
  });
  
// Endpoint to delete a processed image
app.delete('/admin/images/:photoId', (req, res) => {
  const { photoId } = req.params;
  const photo = photoQueue[photoId];

  if (photo && photo.status === 'ready') {
    // Delete the processed image file
    fs.unlink(photo.imagePath, err => {
      if (err) {
        console.error('Error deleting image:', err);
        return res.status(500).json({ message: 'Failed to delete image.' });
      }

      // Remove the image from the queue
      delete photoQueue[photoId];
      res.json({ message: 'Image deleted successfully.' });
    });
  } else {
    res.status(404).json({ message: 'Image not found.' });
  }
});

app.get('/api/photos/:photoId', (req, res) => {
    const { photoId } = req.params;
    const photo = photoQueue[photoId];
  
    if (photo && photo.status === 'ready') {
      res.json({
        imagePath: `/processed/${photoId}.png`,  // Return relative URL path
      });
    } else {
      res.status(404).json({ message: 'Photo not found or still processing.' });
    }
  });  

// Start the server
app.listen(3000, () => console.log('Photo booth app running on port 3000'));
