import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    // Create subdirectories based on file type
    if (file.fieldname === 'profileImage') {
      uploadPath += 'profiles/';
    } else if (file.fieldname === 'assignmentFile') {
      uploadPath += 'assignments/';
    } else if (file.fieldname === 'submissionFile') {
      uploadPath += 'submissions/';
    } else if (file.fieldname === 'resourceFile') {
      uploadPath += 'resources/';
    } else {
      uploadPath += 'general/';
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, baseName + '-' + uniqueSuffix + extension);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    profileImage: /jpeg|jpg|png|gif/,
    assignmentFile: /pdf|doc|docx|txt|jpeg|jpg|png/,
    submissionFile: /pdf|doc|docx|txt|jpeg|jpg|png/,
    resourceFile: /pdf|doc|docx|txt|jpeg|jpg|png|mp4|avi|mov/,
    general: /jpeg|jpg|png|gif|pdf|doc|docx|txt/
  };

  const fieldType = file.fieldname || 'general';
  const allowedPattern = allowedTypes[fieldType] || allowedTypes.general;
  
  // Check file extension
  const extname = allowedPattern.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type
  const mimetype = allowedPattern.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${fieldType}. Allowed types: ${allowedPattern.source}`));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Middleware for different upload types
export const uploadProfileImage = upload.single('profileImage');
export const uploadAssignmentFile = upload.single('assignmentFile');
export const uploadSubmissionFile = upload.single('submissionFile');
export const uploadResourceFile = upload.single('resourceFile');
export const uploadMultipleFiles = upload.array('files', 5); // Max 5 files

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected field name for file upload.' });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
};

// Utility function to get file URL
export const getFileUrl = (req, filename) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
};

// Utility function to delete file
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};
