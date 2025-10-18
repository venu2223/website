const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
// Configure Cloudinary - but only if environment variables are available
const configureCloudinary = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️ Cloudinary environment variables not set - video uploads will be disabled');
    return false;
  }
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('✅ Cloudinary configured with cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
  return true;
};

// Initialize Cloudinary
const cloudinaryInitialized = configureCloudinary();
// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../tmp/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Upload to Cloudinary
// Upload to Cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    if (!cloudinaryInitialized) {
      throw new Error('Cloudinary not configured - check environment variables');
    }
    
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: 'lms/courses/videos'
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// Delete from Cloudinary
const deleteVideo = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    });
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteVideo
};