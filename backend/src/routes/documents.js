const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
  console.error('Multer error:', error);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ msg: 'File too large. Maximum size is 10MB.' });
  }
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ msg: 'Only PDF files are allowed' });
  }
  next(error);
};

// Debug middleware
const debugMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body,
    file: req.file
  });
  next();
};

// Upload route with proper middleware order
router.post('/upload', 
  debugMiddleware,
  authMiddleware, 
  documentController.uploadMiddleware, 
  handleMulterError,
  documentController.uploadDocument
);

router.get('/', authMiddleware, documentController.getDocuments);
router.post('/sign', authMiddleware, documentController.signDocument);
router.get('/download/:docId', authMiddleware, documentController.downloadSigned);

module.exports = router;
