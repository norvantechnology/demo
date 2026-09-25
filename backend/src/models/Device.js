import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    name: { type: String, required: true },
    ip: { type: String, required: true },
    port: { type: Number, default: 4370 },
    lastSyncAt: Date,
    lastSyncNote: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  },
  { timestamps: true }
);

export const Device = mongoose.model('Device', deviceSchema);
