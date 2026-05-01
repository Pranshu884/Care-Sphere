import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true }, // e.g., 'application/pdf', 'image/jpeg'
    doctorName: { type: String, default: '' },
    hospitalName: { type: String, default: '' },
    reportDate: { type: Date, required: true },
    notes: { type: String, default: '' },

    // AI Intelligence Fields
    analysisStatus: {
    type: String,
    enum: ['processing', 'completed', 'partial_analysis', 'failed', 'retry_pending'],
    default: 'processing'
  },
  aiSummary: { type: String, default: '' },
  aiAbnormalities: { type: [String], default: [] },
  aiRecommendations: { type: [String], default: [] },
    healthMetrics: { type: Map, of: String, default: {} },
    followUpSuggestion: { type: String, default: '' },

    // Audit & Structured Parsing
    auditLog: {
       extractionTimestamp: { type: Date },
       aiModelVersion: { type: String, default: '' },
       validatedKeys: { type: [String], default: [] },
       sourceReportType: { type: String, default: '' }
    },
    parsedBiomarkers: [{
       biomarkerName: String,
       normalizedKey: String,
       value: Number,
       unit: String,
       status: String, 
       referenceRange: String
    }]
  },
  { timestamps: true }
);
export default mongoose.model('Report', ReportSchema);
