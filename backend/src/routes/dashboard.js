import { Router } from 'express';
import dayjs from 'dayjs';
import {
  AttendanceRecord,
  LeaveRequest,
  JobOrder,
  Invoice,
  ChangeRequest,
  PayrollRun,
  Employee,
  displayStatus,
} from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { startOfDay } from '../utils/attendance.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const today = startOfDay(new Date());
    const monthStart = dayjs().startOf('month').toDate();
    const monthEnd = dayjs().endOf('month').toDate();
    const d30 = dayjs().subtract(30, 'day').toDate();

    const [
      activeEmployees,
      attendanceToday,
      pendingLeaves,
      pendingChanges,
      joStats,
      joNew30,
      joDone30,
      invoiceAgg,
      paymentsThisMonth,
      recentJobOrders,
      unpaidInvoices,
      latestPayroll,
      onLeaveToday,
    ] = await Promise.all([
      Employee.countDocuments({ status: 'active' }),
      AttendanceRecord.find({ date: today })
        .select('status lateMinutes employee')
        .lean(),
      LeaveRequest.countDocuments({ status: 'pending' }),
      ChangeRequest.countDocuments({ status: 'pending' }),
      JobOrder.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      JobOrder.countDocuments({ status: 'new', createdAt: { $gte: d30 } }),
      JobOrder.countDocuments({ status: 'done', updatedAt: { $gte: d30 } }),
      Invoice.aggregate([
        {
          $project: {
            balance: 1,
            status: 1,
            dueDate: 1,
            total: 1,
            date: 1,
            paid: 1,
          },
        },
        {
          $group: {
            _id: null,
            outstanding: {
              $sum: { $cond: [{ $ne: ['$status', 'paid'] }, '$balance', 0] },
            },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$status', 'paid'] },
                      { $lt: ['$dueDate', today] },
                      { $gt: ['$balance', 0] },
                    ],
                  },
                  '$balance',
                  0,
                ],
              },
            },
            billedThisMonth: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$date', monthStart] }, { $lte: ['$date', monthEnd] }] },
                  '$total',
                  0,
                ],
              },
            },
            openCount: {
              $sum: { $cond: [{ $ne: ['$status', 'paid'] }, 1, 0] },
            },
          },
        },
      ]),
      Invoice.aggregate([
        { $unwind: '$payments' },
        {
          $match: {
            'payments.date': { $gte: monthStart, $lte: monthEnd },
          },
        },
        { $group: { _id: null, collected: { $sum: '$payments.amount' } } },
      ]),
      JobOrder.find()
        .sort({ date: -1, createdAt: -1 })
        .limit(8)
        .select('jobOrderNo date status customer')
        .populate('customer', 'name company')
        .lean(),
      Invoice.find({ status: { $ne: 'paid' } })
        .sort({ dueDate: 1 })
        .limit(10)
        .select('invoiceNo dueDate total balance status customer')
        .populate('customer', 'name company')
        .lean(),
      PayrollRun.findOne().sort({ year: -1, month: -1 }).lean(),
      LeaveRequest.countDocuments({
        status: 'approved',
        from: { $lte: today },
        to: { $gte: today },
        type: { $ne: 'permission_hours' },
      }),
    ]);

    const presentToday = attendanceToday.filter((a) => a.status === 'present').length;
    const absentToday = attendanceToday.filter((a) => a.status === 'absent').length;
    const lateToday = attendanceToday.filter((a) => (a.lateMinutes || 0) > 0).length;

    const statusMap = Object.fromEntries(joStats.map((s) => [s._id, s.count]));
    const inv = invoiceAgg[0] || {
      outstanding: 0,
      overdue: 0,
      billedThisMonth: 0,
      openCount: 0,
    };

    res.json({
      presentToday,
      totalActive: activeEmployees,
      absentToday,
      lateToday,
      onLeaveToday,
      pendingApprovals: {
        leaveRequests: pendingLeaves,
        changeRequests: pendingChanges,
      },
      inPress: {
        count: statusMap.in_press || 0,
        new: statusMap.new || joNew30,
        done30d: joDone30,
        new30d: joNew30,
      },
      outstanding: Math.round((inv.outstanding || 0) * 1000) / 1000,
      overdue: Math.round((inv.overdue || 0) * 1000) / 1000,
      openInvoices: inv.openCount || 0,
      billedThisMonth: Math.round((inv.billedThisMonth || 0) * 1000) / 1000,
      collectedThisMonth: Math.round(((paymentsThisMonth[0]?.collected || 0) * 1000)) / 1000,
      recentJobOrders,
      unpaidInvoices: unpaidInvoices.map((invRow) => ({
        ...invRow,
        displayStatus: displayStatus(invRow),
      })),
      latestPayroll: latestPayroll
        ? {
            id: latestPayroll._id,
            month: latestPayroll.month,
            year: latestPayroll.year,
            status: latestPayroll.status,
            totalNet: latestPayroll.totalNet,
          }
        : null,
    });
  })
);

export default router;
