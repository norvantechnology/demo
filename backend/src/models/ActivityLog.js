import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    entityType: { type: String, enum: ['job_order', 'leave_request'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

activityLogSchema.index({ entityType: 1, entityId: 1, at: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
