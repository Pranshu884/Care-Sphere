import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import Report from '../models/Report.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { analyzeHealthReport } from '../services/aiService.js';
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

    // Process both Cloudinary upload and AI Analysis concurrently
    const [uploadResult, aiAnalysis] = await Promise.all([
      streamUpload(req),
      analyzeHealthReport(req.file.buffer, req.file.mimetype)
    ]);

    const newReport = new Report({
      userId: req.auth.userId,
      title: title || 'Untitled Report',
      // Always favor AI category prediction if present, or fallback to user selected/Other
      category: aiAnalysis?.category || category || 'Other',
      fileUrl: uploadResult.secure_url,
      fileType: req.file.mimetype,
      doctorName: doctorName || '',
      hospitalName: hospitalName || '',
      reportDate: reportDate ? new Date(reportDate) : new Date(),
      notes: notes || '',
      aiSummary: aiAnalysis?.summary || '',
      aiAbnormalities: aiAnalysis?.abnormalities || [],
      aiRecommendations: aiAnalysis?.recommendations || [],
      healthMetrics: aiAnalysis?.healthMetrics || {},
      followUpDate: aiAnalysis?.followUpDate ? new Date(aiAnalysis.followUpDate) : undefined,
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

// ---------------------------------------------------------------------------
// ADDED FOR AI DOCTOR NOTES / EMERGENCY PROFILE
// ---------------------------------------------------------------------------

// Update Doctor Notes on an existing report
router.put('/:id/notes', async (req, res) => {
   try {
      const { notes } = req.body;
      const report = await Report.findOneAndUpdate(
         { _id: req.params.id, userId: req.auth.userId },
         { notes },
         { new: true }
      );
      if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
      res.json({ success: true, report });
   } catch (error) {
      console.error('Update notes error:', error);
      res.status(500).json({ success: false, message: 'Failed to update notes.' });
   }
});

// We can put emergency profile under auth or user routes usually, but for scoping within Health Hub, letting it sit under user router is better. Since this file is export default router, and mounted on /api/reports, we might want to put emergency profile in a user route or add it to authRoutes instead.

export default router;
