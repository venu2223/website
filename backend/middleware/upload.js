const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '../uploads/videos'),
    path.join(__dirname, '../uploads/documents')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDirs();
    
    if (file.fieldname === 'video') {
      cb(null, path.join(__dirname, '../uploads/videos'));
    } else if (file.fieldname === 'document') {
      cb(null, path.join(__dirname, '../uploads/documents'));
    } else {
      cb(new Error('Unexpected file field: ' + file.fieldname));
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    // Allow video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for video upload'), false);
    }
  } else if (file.fieldname === 'document') {
    // Allow document files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, PPT, and TXT files are allowed for document upload'), false);
    }
  } else {
    cb(new Error('Unexpected file field: ' + file.fieldname), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

module.exports = upload;