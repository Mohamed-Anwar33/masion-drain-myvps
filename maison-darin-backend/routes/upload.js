const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbixjzxgp',
  api_key: process.env.CLOUDINARY_API_KEY || '541661697753599',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'nBlJQPoCISYrdFu2YR6GlDtKskU'
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload image endpoint
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    console.log('📤 Upload request received:', {
      hasFile: !!req.file,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype
    });

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }

    // Check file size
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(413).json({ 
        success: false,
        error: 'File too large. Maximum size is 50MB' 
      });
    }

    // Try Cloudinary upload first
    try {
      console.log('☁️ Attempting Cloudinary upload...');
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'maison-darin/hero-images',
            transformation: [
              { quality: 'auto', fetch_format: 'auto' },
              { width: 1920, height: 1080, crop: 'limit' }
            ],
            tags: ['maison-darin', 'hero', 'admin-upload']
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary error:', error);
              reject(error);
            } else {
              console.log('✅ Cloudinary upload successful:', result.public_id);
              resolve(result);
            }
          }
        ).end(req.file.buffer);
      });

      return res.json({
        success: true,
        url: result.secure_url,
        cloudinaryId: result.public_id,
        width: result.width,
        height: result.height
      });

    } catch (cloudinaryError) {
      console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryError);
      
      // Fallback to local storage
      const uploadsDir = path.join(__dirname, '../uploads/images');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${req.file.originalname.split('.').pop()}`;
      const filepath = path.join(uploadsDir, filename);
      
      await fs.writeFile(filepath, req.file.buffer);
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const imageUrl = `${baseUrl}/uploads/images/${filename}`;
      
      return res.json({
        success: true,
        url: imageUrl,
        cloudinaryId: null,
        local: true,
        filename: filename
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message 
    });
  }
});

// Upload multiple images endpoint
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const uploadResults = [];

    for (const file of req.files) {
      try {
        // Try Cloudinary upload
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'maison-darin/hero-images',
              transformation: [
                { quality: 'auto', fetch_format: 'auto' },
                { width: 1920, height: 1080, crop: 'limit' }
              ],
              tags: ['maison-darin', 'hero', 'admin-upload']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });

        uploadResults.push({
          success: true,
          url: result.secure_url,
          cloudinaryId: result.public_id,
          width: result.width,
          height: result.height,
          originalName: file.originalname
        });

      } catch (cloudinaryError) {
        console.warn(`Cloudinary upload failed for ${file.originalname}, using local storage`);
        
        // Fallback to local storage
        const uploadsDir = path.join(__dirname, '../uploads/images');
        await fs.mkdir(uploadsDir, { recursive: true });
        
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.originalname.split('.').pop()}`;
        const filepath = path.join(uploadsDir, filename);
        
        await fs.writeFile(filepath, file.buffer);
        
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${baseUrl}/uploads/images/${filename}`;
        
        uploadResults.push({
          success: true,
          url: imageUrl,
          cloudinaryId: null,
          local: true,
          filename: filename,
          originalName: file.originalname
        });
      }
    }

    res.json({
      success: true,
      results: uploadResults,
      count: uploadResults.length
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload images',
      details: error.message 
    });
  }
});

// Error handler for multer
router.use((error, req, res, next) => {
  console.error('📤 Upload error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large. Maximum size is 50MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      error: 'Only image files are allowed'
    });
  }
  
  return res.status(500).json({
    success: false,
    error: 'Upload failed: ' + error.message
  });
});

module.exports = router;
