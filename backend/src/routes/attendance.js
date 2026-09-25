import { Router } from 'express';
import dayjs from 'dayjs';
import { AttendanceRecord, Employee, Company } from '../models/index.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { recomputeAttendanceMetrics, startOfDay } from '../utils/attendance.js';

const router = Router();

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const month = Number(req.query.month) || dayjs().month() + 1;
    const year = Number(req.query.year) || dayjs().year();
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month').toDate();
    const end = dayjs(start).endOf('month').toDate();

    const employees = await Employee.find({ status: 'active' })
      .select('name employeeNo')
      .sort({ employeeNo: 1 })
      .lean();

    const records = await AttendanceRecord.find({
      date: { $gte: start, $lte: end },
      employee: { $in: employees.map((e) => e._id) },
    })
      .select('employee status lateMinutes overtimeMinutes shortfallMinutes')
      .lean();

    const byEmp = {};
    for (const e of employees) {
      byEmp[e._id.toString()] = {
        employeeId: e._id,
        name: e.name,
        employeeNo: e.employeeNo,
        present: 0,
        absent: 0,
        late: 0,
        overtimeMinutes: 0,
        shortfallMinutes: 0,
      };
    }
    for (const r of records) {
      const row = byEmp[r.employee.toString()];
      if (!row) continue;
      if (r.status === 'present') row.present += 1;
      if (r.status === 'absent') row.absent += 1;
      if ((r.lateMinutes || 0) > 0) row.late += 1;
      row.overtimeMinutes += r.overtimeMinutes || 0;
      row.shortfallMinutes += r.shortfallMinutes || 0;
    }
    res.json({ month, year, data: Object.values(byEmp) });
  })
);

router.get(
  '/employee/:employeeId',
  asyncHandler(async (req, res) => {
    const month = Number(req.query.month) || dayjs().month() + 1;
    const year = Number(req.query.year) || dayjs().year();
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month').toDate();
    const end = dayjs(start).endOf('month').toDate();

    const employee = await Employee.findById(req.params.employeeId)
      .select('name employeeNo')
      .lean();
    if (!employee) throw Errors.notFound('Employee not found');

    const data = await AttendanceRecord.find({
      employee: req.params.employeeId,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: 1 })
      .lean();

    res.json({ employee, month, year, data });
  })
);

router.patch(
  '/:recordId',
  asyncHandler(async (req, res) => {
    const record = await AttendanceRecord.findById(req.params.recordId);
    if (!record) throw Errors.notFound('Attendance record not found');
    const company = await Company.findOne().lean();
    const rules = company?.attendanceRules || {};

    if (req.body.checkIn) record.checkIn = new Date(req.body.checkIn);
    if (req.body.checkOut) record.checkOut = new Date(req.body.checkOut);
    if ('note' in (req.body || {})) record.note = req.body.note;
    record.source = 'manual';
    if (record.checkIn && record.checkOut) record.status = 'present';

    const metrics = recomputeAttendanceMetrics(record, rules);
    Object.assign(record, metrics);
    await record.save();
    res.json(record);
  })
);

router.post(
  '/:recordId/use-device-punches',
  asyncHandler(async (req, res) => {
    const record = await AttendanceRecord.findById(req.params.recordId);
    if (!record) throw Errors.notFound('Attendance record not found');
    const company = await Company.findOne().lean();
    const rules = company?.attendanceRules || {};

    record.checkIn = record.deviceCheckIn || record.checkIn;
    record.checkOut = record.deviceCheckOut || record.checkOut;
    record.source = 'device';
    const metrics = recomputeAttendanceMetrics(record, rules);
    Object.assign(record, metrics);
    await record.save();
    res.json(record);
  })
);

router.post(
  '/recompute',
  asyncHandler(async (req, res) => {
    const month = Number(req.body?.month) || dayjs().month() + 1;
    const year = Number(req.body?.year) || dayjs().year();
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month').toDate();
    const end = dayjs(start).endOf('month').toDate();
    const company = await Company.findOne().lean();
    const rules = company?.attendanceRules || {};

    const records = await AttendanceRecord.find({ date: { $gte: start, $lte: end } });
    for (const record of records) {
      if (record.status !== 'present') {
        record.workedMinutes = 0;
        record.lateMinutes = 0;
        record.overtimeMinutes = 0;
        record.shortfallMinutes = 0;
      } else {
        const metrics = recomputeAttendanceMetrics(record, rules);
        Object.assign(record, metrics);
      }
      await record.save();
    }
    res.json({ ok: true, recomputed: records.length });
  })
);

export default router;
