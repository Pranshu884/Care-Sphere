import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import Report from '../models/Report.js';
import authMiddleware from '../middleware/authMiddleware.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Cloudinary configuration (Requires setting in .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(authMiddleware);

// Upload a generic health report
router.post('/upload', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { title, category, doctorName, hospitalName, reportDate, notes } = req.body;
    
    // Promisify stream upload to Cloudinary
    const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: 'auto', folder: 'care-sphere/reports' },
              (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(error);
                }
              }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };

    const uploadResult = await streamUpload(req);

    const newReport = new Report({
      userId: req.auth.userId, // From auth middleware
      title: title || 'Untitled Report',
      category: category || 'Other',
      fileUrl: uploadResult.secure_url,
      fileType: req.file.mimetype,
      doctorName: doctorName || '',
      hospitalName: hospitalName || '',
      reportDate: reportDate ? new Date(reportDate) : new Date(),
      notes: notes || '',
    });

    await newReport.save();

    res.status(201).json({ success: true, report: newReport });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed.', error: error.message });
  }
});

// Get all reports for the logged in user
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.auth.userId }).sort({ reportDate: -1, createdAt: -1 });
    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
});

// Delete a report
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found or not authorized.' });
    }

    // Extract public_id from secure_url and remove from Cloudinary
    try {
      const urlParts = report.fileUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = filename.split('.')[0];
      await cloudinary.uploader.destroy(`care-sphere/reports/${publicId}`);
    } catch (cleanupError) {
      console.error('Failed to scrub from Cloudinary:', cleanupError);
    }

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

export default router;
