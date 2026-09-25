import { Router } from 'express';
import {
  JobOrder,
  Company,
  nextCounter,
  ActivityLog,
  ChangeRequest,
  Customer,
  Invoice,
} from '../models/index.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireOwner } from '../middleware/auth.js';

const router = Router();

const JO_LIST_SELECT =
  'jobOrderNo date customer jobNature qtyRequired status invoice createdAt';

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip, search } = parsePagination(req.query);
    const status = req.query.status || 'all';
    const filter = {};
    if (status !== 'all') filter.status = status;
    if (req.query.customerId) filter.customer = req.query.customerId;

    if (search) {
      const asNum = Number(search);
      const customerIds = await Customer.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { company: new RegExp(search, 'i') },
        ],
      })
        .select('_id')
        .lean();
      filter.$or = [
        { jobNature: new RegExp(search, 'i') },
        { customer: { $in: customerIds.map((c) => c._id) } },
      ];
      if (!Number.isNaN(asNum) && asNum > 0) filter.$or.push({ jobOrderNo: asNum });
    }

    const [rows, total] = await Promise.all([
      JobOrder.find(filter)
        .sort({ date: -1, jobOrderNo: -1 })
        .skip(skip)
        .limit(limit)
        .select(JO_LIST_SELECT)
        .populate('customer', 'name company')
        .populate('invoice', 'invoiceNo')
        .lean(),
      JobOrder.countDocuments(filter),
    ]);

    const ids = rows.map((r) => r._id);
    const pending = await ChangeRequest.aggregate([
      {
        $match: {
          entityType: 'job_order',
          entityId: { $in: ids },
          status: 'pending',
        },
      },
      { $group: { _id: '$entityId', count: { $sum: 1 } } },
    ]);
    const pendingMap = Object.fromEntries(pending.map((p) => [p._id.toString(), p.count]));

    const data = rows.map((r) => ({
      ...r,
      pendingChangeRequests: pendingMap[r._id.toString()] || 0,
    }));
    res.json(paginated(data, total, page, limit));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.customer) throw Errors.validation('Customer is required', { customer: 'required' });
    if (!body.jobNature?.trim())
      throw Errors.validation('Job nature is required', { jobNature: 'required' });
    if (body.qtyRequired == null)
      throw Errors.validation('Qty required is required', { qtyRequired: 'required' });

    const company = await Company.findOne();
    if (!company) throw Errors.notFound('Company not found');
    const jobOrderNo = await nextCounter(company._id, 'jobOrderNext');

    const doc = await JobOrder.create({
      ...body,
      jobOrderNo,
      date: body.date || new Date(),
      createdBy: req.user._id,
      status: 'new',
      companyId: company._id,
    });

    await ActivityLog.create({
      entityType: 'job_order',
      entityId: doc._id,
      action: 'created',
      by: req.user._id,
      meta: { jobOrderNo },
    });

    const populated = await JobOrder.findById(doc._id)
      .populate('customer')
      .populate('createdBy', 'name role')
      .lean();
    res.status(201).json(populated);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await JobOrder.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name role')
      .populate('invoice', 'invoiceNo status balance')
      .lean();
    if (!doc) throw Errors.notFound('Job order not found');

    const [activity, changeRequests] = await Promise.all([
      ActivityLog.find({ entityType: 'job_order', entityId: doc._id })
        .sort({ at: -1 })
        .limit(20)
        .populate('by', 'name role')
        .lean(),
      ChangeRequest.find({
        entityType: 'job_order',
        entityId: doc._id,
        status: 'pending',
      })
        .populate('requestedBy', 'name role')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.json({ ...doc, activity, changeRequests });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = { ...(req.body || {}) };
    delete body.jobOrderNo;
    delete body.createdBy;
    delete body.invoice;
    const before = await JobOrder.findById(req.params.id);
    if (!before) throw Errors.notFound('Job order not found');
    Object.assign(before, body);
    await before.save();
    await ActivityLog.create({
      entityType: 'job_order',
      entityId: before._id,
      action: 'updated',
      by: req.user._id,
      meta: { fields: Object.keys(body) },
    });
    const populated = await JobOrder.findById(before._id)
      .populate('customer')
      .populate('createdBy', 'name role')
      .lean();
    res.json(populated);
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!['new', 'in_press', 'done'].includes(status)) {
      throw Errors.validation('Invalid status');
    }
    const doc = await JobOrder.findById(req.params.id);
    if (!doc) throw Errors.notFound('Job order not found');
    const from = doc.status;
    doc.status = status;
    await doc.save();
    await ActivityLog.create({
      entityType: 'job_order',
      entityId: doc._id,
      action: 'status_changed',
      by: req.user._id,
      meta: { from, to: status },
    });
    res.json(doc);
  })
);

router.delete(
  '/:id',
  requireOwner,
  asyncHandler(async (req, res) => {
    const doc = await JobOrder.findById(req.params.id);
    if (!doc) throw Errors.notFound('Job order not found');
    if (doc.invoice) throw Errors.conflict('Cannot delete job order with an invoice');
    await doc.deleteOne();
    res.json({ ok: true });
  })
);

router.get(
  '/:id/print',
  asyncHandler(async (req, res) => {
    const doc = await JobOrder.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name role')
      .lean();
    if (!doc) throw Errors.notFound('Job order not found');
    const company = await Company.findOne().lean();
    res.json({ jobOrder: doc, company });
  })
);

router.post(
  '/:id/change-requests',
  asyncHandler(async (req, res) => {
    const jo = await JobOrder.findById(req.params.id);
    if (!jo) throw Errors.notFound('Job order not found');
    if (!req.body?.changes) throw Errors.validation('Changes required');
    const cr = await ChangeRequest.create({
      entityType: 'job_order',
      entityId: jo._id,
      requestedBy: req.user._id,
      changes: req.body.changes,
    });
    const populated = await ChangeRequest.findById(cr._id)
      .populate('requestedBy', 'name role')
      .lean();
    res.status(201).json(populated);
  })
);

export default router;
