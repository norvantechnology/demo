import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, index: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'off'], required: true },
    checkIn: Date,
    checkOut: Date,
    workedMinutes: { type: Number, default: 0 },
    lateMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    shortfallMinutes: { type: Number, default: 0 },
    source: { type: String, enum: ['device', 'manual'], default: 'device' },
    deviceCheckIn: Date,
    deviceCheckOut: Date,
    note: String,
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceSchema);
