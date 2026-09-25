import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: {
      type: String,
      enum: ['annual', 'sick_full_pay', 'permission_hours', 'unpaid'],
      required: true,
    },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    unit: { type: String, enum: ['days', 'hours'], required: true },
    amount: { type: Number, required: true },
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decidedAt: Date,
  },
  { timestamps: true }
);

leaveSchema.index({ employee: 1, from: -1 });
leaveSchema.index({ status: 1 });

export const LeaveRequest = mongoose.model('LeaveRequest', leaveSchema);
