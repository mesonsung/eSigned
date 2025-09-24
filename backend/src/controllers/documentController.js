const Document = require('../models/Document');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

// Ensure storage directories exist
const storageDir = 'storage';
const uploadsDir = path.join(storageDir, 'uploads');
const signedDir = path.join(storageDir, 'signed');

if (!require('fs').existsSync(storageDir)) {
  require('fs').mkdirSync(storageDir, { recursive: true });
}
if (!require('fs').existsSync(uploadsDir)) {
  require('fs').mkdirSync(uploadsDir, { recursive: true });
}
if (!require('fs').existsSync(signedDir)) {
  require('fs').mkdirSync(signedDir, { recursive: true });
}

// Create temp directory for uploads
const tempDir = path.join(uploadsDir, 'temp');
if (!require('fs').existsSync(tempDir)) {
  require('fs').mkdirSync(tempDir, { recursive: true });
}

// Configure multer with file validation (save to temp location first)
const upload = multer({
  dest: uploadsDir + '/temp/',  // Save to temp subdirectory first
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Upload middleware
exports.uploadMiddleware = upload.single('file');

// Upload controller
exports.uploadDocument = async (req, res) => {
  try {
    console.log('Upload request received:', {
      hasFile: !!req.file,
      user: req.user,
      headers: req.headers
    });

    // Check if file was uploaded
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Validate file
    if (req.file.mimetype !== 'application/pdf') {
      console.log('Invalid file type:', req.file.mimetype);
      return res.status(400).json({ msg: 'Only PDF files are allowed' });
    }

    // Check if file already exists (check in main uploads directory, not temp)
    const finalFilePath = path.join(uploadsDir, req.file.originalname);
    console.log('Checking if file already exists:', finalFilePath);
    
    try {
      await fs.access(finalFilePath);
      console.log('File already exists:', req.file.originalname);
      
      // Clean up the temporary uploaded file since it's a duplicate
      try {
        await fs.unlink(req.file.path);
        console.log('Temporary duplicate file cleaned up');
      } catch (unlinkError) {
        console.error('Error cleaning up duplicate file:', unlinkError);
      }
      
      return res.status(409).json({ 
        msg: `File "${req.file.originalname}" already exists. Please choose a different file or rename the existing one.`,
        errorType: 'duplicate_file',
        filename: req.file.originalname
      });
    } catch (accessError) {
      console.log('File does not exist, proceeding with upload');
    }

    // Move the uploaded file from temp to final location with original name
    console.log('Moving uploaded file from temp to final location:', finalFilePath);
    try {
      await fs.rename(req.file.path, finalFilePath);
      console.log('File moved successfully to:', finalFilePath);
      // Update the file path in req.file for further processing
      req.file.path = finalFilePath;
    } catch (moveError) {
      console.error('Error moving file:', moveError);
      return res.status(500).json({ msg: 'Error processing uploaded file' });
    }

    // Validate PDF is not encrypted
    console.log('Validating PDF file...');
    try {
      const pdfBytes = await fs.readFile(req.file.path);
      await PDFDocument.load(pdfBytes);
      console.log('PDF validation successful - file is not encrypted');
    } catch (pdfError) {
      console.error('PDF validation failed:', pdfError.message);
      
      // Clean up the uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up invalid PDF:', unlinkError);
      }
      
      if (pdfError.message.includes('encrypted')) {
        return res.status(400).json({ 
          msg: 'This PDF document is encrypted or password-protected. Please use an unencrypted PDF file.',
          errorType: 'encrypted_pdf'
        });
      } else if (pdfError.message.includes('corrupted') || pdfError.message.includes('invalid')) {
        return res.status(400).json({ 
          msg: 'This PDF document appears to be corrupted or invalid. Please use a valid PDF file.',
          errorType: 'corrupted_pdf'
        });
      } else {
        return res.status(400).json({ 
          msg: 'Unable to process this PDF document. Please ensure it is a valid, unencrypted PDF file.',
          errorType: 'pdf_processing_error'
        });
      }
    }

    // Create document record
    const doc = new Document({
      filename: req.file.originalname,
      originalPath: req.file.path,
      signers: [req.user.id],
      status: 'pending'
    });

    console.log('Saving document:', doc);
    await doc.save();
    
    console.log('Document uploaded successfully:', doc.filename);
    res.json(doc);
    
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up uploaded file if document creation failed
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      msg: error.message || 'Upload failed. Please try again.' 
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ signers: req.user.id });
    res.json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ msg: 'Failed to fetch documents' });
  }
};

exports.signDocument = async (req, res) => {
  const { docId, signatureImageBase64 } = req.body;
  
  console.log('Sign document request received:', {
    docId,
    hasSignature: !!signatureImageBase64,
    signatureLength: signatureImageBase64 ? signatureImageBase64.length : 0,
    user: req.user
  });
  
  try {
    // Validate input
    if (!docId) {
      console.log('Missing docId');
      return res.status(400).json({ msg: 'Document ID is required' });
    }
    
    if (!signatureImageBase64) {
      console.log('Missing signature data');
      return res.status(400).json({ msg: 'Signature data is required' });
    }
    
    // Find document
    console.log('Looking for document with ID:', docId);
    const doc = await Document.findById(docId);
    if (!doc) {
      console.log('Document not found:', docId);
      return res.status(404).json({ msg: 'Document not found' });
    }
    
    console.log('Document found:', {
      filename: doc.filename,
      originalPath: doc.originalPath,
      status: doc.status
    });

    // Check if original file exists
    try {
      await fs.access(doc.originalPath);
      console.log('Original file exists:', doc.originalPath);
    } catch (accessError) {
      console.error('Original file not found:', doc.originalPath, accessError.message);
      return res.status(404).json({ msg: 'Original document file not found' });
    }

    // Read PDF file
    console.log('Reading PDF file...');
    const pdfBytes = await fs.readFile(doc.originalPath);
    console.log('PDF file read, size:', pdfBytes.length);

    // Load PDF document
    console.log('Loading PDF document...');
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(pdfBytes);
      console.log('PDF document loaded successfully');
    } catch (pdfError) {
      console.error('PDF loading error:', pdfError.message);
      
      // Check for specific PDF errors
      if (pdfError.message.includes('encrypted')) {
        console.error('PDF is encrypted/password-protected');
        return res.status(400).json({ 
          msg: 'This PDF document is encrypted or password-protected. Please use an unencrypted PDF file for signing.',
          errorType: 'encrypted_pdf'
        });
      } else if (pdfError.message.includes('corrupted') || pdfError.message.includes('invalid')) {
        console.error('PDF is corrupted or invalid');
        return res.status(400).json({ 
          msg: 'This PDF document appears to be corrupted or invalid. Please use a valid PDF file.',
          errorType: 'corrupted_pdf'
        });
      } else {
        console.error('Unknown PDF error:', pdfError.message);
        return res.status(400).json({ 
          msg: 'Unable to process this PDF document. Please ensure it is a valid, unencrypted PDF file.',
          errorType: 'pdf_processing_error'
        });
      }
    }

    // Embed signature image
    console.log('Embedding signature image...');
    
    // Handle data URL format (data:image/png;base64,...)
    let base64Data = signatureImageBase64;
    if (signatureImageBase64.startsWith('data:')) {
      console.log('Processing data URL format');
      const base64Index = signatureImageBase64.indexOf(',');
      if (base64Index !== -1) {
        base64Data = signatureImageBase64.substring(base64Index + 1);
        console.log('Extracted base64 data, length:', base64Data.length);
      } else {
        console.error('Invalid data URL format');
        return res.status(400).json({ msg: 'Invalid signature data format' });
      }
    }
    
    const signatureImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));
    console.log('Signature image embedded successfully');

    // Draw signature on first page
    console.log('Drawing signature on page...');
    const page = pdfDoc.getPage(0);
    
    // Get page dimensions for positioning
    const { width: pageWidth, height: pageHeight } = page.getSize();
    console.log('Page dimensions:', { pageWidth, pageHeight });
    
    // Signature dimensions (doubled from original 100x50)
    const signatureWidth = 200;
    const signatureHeight = 100;
    
    // Position signature in bottom-right corner with margin
    const margin = 20;
    const signatureX = pageWidth - signatureWidth - margin;
    const signatureY = margin; // PDF coordinates start from bottom-left, so margin from bottom
    
    console.log('Signature positioning:', { 
      signatureX, 
      signatureY, 
      signatureWidth, 
      signatureHeight 
    });
    
    // Draw signature with bold effect by drawing multiple times with slight offsets
    const boldOffset = 1; // Offset for bold effect
    
    // Draw signature multiple times to create bold effect
    page.drawImage(signatureImage, { 
      x: signatureX - boldOffset, 
      y: signatureY - boldOffset, 
      width: signatureWidth, 
      height: signatureHeight 
    });
    
    page.drawImage(signatureImage, { 
      x: signatureX + boldOffset, 
      y: signatureY - boldOffset, 
      width: signatureWidth, 
      height: signatureHeight 
    });
    
    page.drawImage(signatureImage, { 
      x: signatureX - boldOffset, 
      y: signatureY + boldOffset, 
      width: signatureWidth, 
      height: signatureHeight 
    });
    
    page.drawImage(signatureImage, { 
      x: signatureX + boldOffset, 
      y: signatureY + boldOffset, 
      width: signatureWidth, 
      height: signatureHeight 
    });
    
    // Draw the main signature in the center
    page.drawImage(signatureImage, { 
      x: signatureX, 
      y: signatureY, 
      width: signatureWidth, 
      height: signatureHeight 
    });
    
    console.log('Bold signature drawn on page');

    // Save signed PDF
    console.log('Saving signed PDF...');
    const signedPdfBytes = await pdfDoc.save();
    console.log('Signed PDF saved, size:', signedPdfBytes.length);

    // Write signed file to signed directory using signer ID
    const signedPath = path.join(signedDir, `${req.user.id}_${doc.filename}`);
    console.log('Writing signed file to:', signedPath);
    await fs.writeFile(signedPath, signedPdfBytes);
    console.log('Signed file written successfully');

    // Update document record
    console.log('Updating document record...');
    doc.signedPath = signedPath;
    doc.status = 'signed';
    await doc.save();
    console.log('Document record updated successfully');

    res.json({ signedPath });
  } catch (err) {
    console.error('Sign document error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ msg: err.message });
  }
};

exports.downloadSigned = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findById(docId);
    
    if (!doc) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    
    if (!doc.signedPath) {
      return res.status(404).json({ msg: 'Signed document not available' });
    }
    
    // Check if file exists
    try {
      await fs.access(doc.signedPath);
      res.download(doc.signedPath);
    } catch (fileError) {
      console.error('File not found:', doc.signedPath, fileError.message);
      res.status(404).json({ msg: 'Signed file not found on server' });
    }
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ msg: 'Download failed' });
  }
};

exports.viewDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await Document.findById(docId);
    
    if (!doc) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    
    // Check if user has access to this document
    if (!doc.signers.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    // Check if original file exists
    try {
      await fs.access(doc.originalPath);
      res.sendFile(path.resolve(doc.originalPath));
    } catch (fileError) {
      console.error('File not found:', doc.originalPath, fileError.message);
      res.status(404).json({ msg: 'Original file not found on server' });
    }
    
  } catch (error) {
    console.error('View document error:', error);
    res.status(500).json({ msg: 'Failed to view document' });
  }
};
