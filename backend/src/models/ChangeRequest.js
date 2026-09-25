import mongoose from 'mongoose';

const changeRequestSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    entityType: { type: String, enum: ['job_order'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changes: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decidedAt: Date,
  },
  { timestamps: true }
);

changeRequestSchema.index({ entityType: 1, entityId: 1, status: 1 });
changeRequestSchema.index({ status: 1, createdAt: -1 });

export const ChangeRequest = mongoose.model('ChangeRequest', changeRequestSchema);
