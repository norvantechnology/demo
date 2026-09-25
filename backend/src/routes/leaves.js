import { Router } from 'express';
import { LeaveRequest, Employee, Company } from '../models/index.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireOwner } from '../middleware/auth.js';

const router = Router();

router.get(
  '/balances',
  asyncHandler(async (req, res) => {
    const year = Number(req.query.year) || new Date().getFullYear();
    const company = await Company.findOne().lean();
    const entitlement = company?.payrollRules?.annualLeaveDaysPerYear || 30;
    const employees = await Employee.find({ status: 'active' })
      .select('name employeeNo')
      .sort({ employeeNo: 1 })
      .lean();
    const taken = await LeaveRequest.aggregate([
      {
        $match: {
          type: 'annual',
          status: 'approved',
          from: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31T23:59:59`),
          },
        },
      },
      { $group: { _id: '$employee', taken: { $sum: '$amount' } } },
    ]);
    const takenMap = Object.fromEntries(taken.map((t) => [t._id.toString(), t.taken]));
    res.json({
      year,
      entitlement,
      data: employees.map((e) => {
        const t = takenMap[e._id.toString()] || 0;
        return {
          employeeId: e._id,
          name: e.name,
          employeeNo: e.employeeNo,
          entitlement,
          taken: t,
          remaining: Math.max(0, entitlement - t),
        };
      }),
    });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const status = req.query.status || 'all';
    const filter = {};
    if (status !== 'all') filter.status = status;
    const [data, total] = await Promise.all([
      LeaveRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('employee', 'name employeeNo')
        .populate('requestedBy', 'name role')
        .populate('decidedBy', 'name role')
        .lean(),
      LeaveRequest.countDocuments(filter),
    ]);
    res.json(paginated(data, total, page, limit));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.employeeId) throw Errors.validation('Employee is required', { employeeId: 'required' });
    if (!body.type) throw Errors.validation('Type is required', { type: 'required' });
    if (!body.from) throw Errors.validation('From date is required', { from: 'required' });

    const isPermission = body.type === 'permission_hours';
    const unit = isPermission ? 'hours' : body.unit || 'days';
    const to = isPermission ? body.from : body.to;
    if (!to) throw Errors.validation('To date is required', { to: 'required' });
    if (!isPermission && new Date(to) < new Date(body.from)) {
      throw Errors.validation('To must be on or after From');
    }
    const amount =
      body.amount ??
      (isPermission
        ? 1
        : Math.max(
            1,
            Math.round((new Date(to) - new Date(body.from)) / 86400000) + 1
          ));

    const doc = await LeaveRequest.create({
      employee: body.employeeId,
      type: body.type,
      from: body.from,
      to,
      unit,
      amount,
      reason: body.reason,
      requestedBy: req.user._id,
      status: 'pending',
    });
    const populated = await LeaveRequest.findById(doc._id)
      .populate('employee', 'name employeeNo')
      .populate('requestedBy', 'name role')
      .lean();
    res.status(201).json(populated);
  })
);

router.patch(
  '/:id/approve',
  requireOwner,
  asyncHandler(async (req, res) => {
    const doc = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        decidedBy: req.user._id,
        decidedAt: new Date(),
      },
      { new: true }
    )
      .populate('employee', 'name employeeNo')
      .populate('requestedBy', 'name role')
      .populate('decidedBy', 'name role');
    if (!doc) throw Errors.notFound('Leave request not found');
    res.json(doc);
  })
);

router.patch(
  '/:id/reject',
  requireOwner,
  asyncHandler(async (req, res) => {
    const doc = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        decidedBy: req.user._id,
        decidedAt: new Date(),
      },
      { new: true }
    )
      .populate('employee', 'name employeeNo')
      .populate('requestedBy', 'name role')
      .populate('decidedBy', 'name role');
    if (!doc) throw Errors.notFound('Leave request not found');
    res.json(doc);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!doc) throw Errors.notFound('Leave request not found');
    res.json({ ok: true });
  })
);

export default router;
