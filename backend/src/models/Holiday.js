import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    name: { type: String, required: true },
    date: { type: Date, required: true },
    recurring: { type: Boolean, default: false },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 });

export const Holiday = mongoose.model('Holiday', holidaySchema);
