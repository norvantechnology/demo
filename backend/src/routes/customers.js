import { Router } from 'express';
import { Customer, JobOrder, Invoice } from '../models/index.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireOwner } from '../middleware/auth.js';

const router = Router();

async function customerStats(customerIds) {
  if (!customerIds.length) return {};
  const [joCounts, outstanding] = await Promise.all([
    JobOrder.aggregate([
      { $match: { customer: { $in: customerIds } } },
      { $group: { _id: '$customer', count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { customer: { $in: customerIds }, status: { $ne: 'paid' } } },
      { $group: { _id: '$customer', outstanding: { $sum: '$balance' } } },
    ]),
  ]);
  const map = {};
  for (const id of customerIds) {
    map[id.toString()] = { jobOrderCount: 0, outstanding: 0 };
  }
  for (const r of joCounts) {
    map[r._id.toString()].jobOrderCount = r.count;
  }
  for (const r of outstanding) {
    map[r._id.toString()].outstanding = Math.round(r.outstanding * 1000) / 1000;
  }
  return map;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip, sort, search } = parsePagination(req.query);
    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }
    const [rows, total] = await Promise.all([
      Customer.find(filter)
        .sort(sort.createdAt ? sort : { name: 1 })
        .skip(skip)
        .limit(limit)
        .select('name company phone email address note createdAt')
        .lean(),
      Customer.countDocuments(filter),
    ]);
    const stats = await customerStats(rows.map((r) => r._id));
    const data = rows.map((r) => ({
      ...r,
      jobOrderCount: stats[r._id.toString()]?.jobOrderCount || 0,
      outstanding: stats[r._id.toString()]?.outstanding || 0,
    }));
    res.json(paginated(data, total, page, limit));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, company, phone, email, address, note } = req.body || {};
    if (!name?.trim()) throw Errors.validation('Name is required', { name: 'required' });
    const doc = await Customer.create({
      name: name.trim(),
      company,
      phone,
      email,
      address,
      note,
    });
    res.status(201).json(doc);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await Customer.findById(req.params.id).lean();
    if (!doc) throw Errors.notFound('Customer not found');
    const stats = await customerStats([doc._id]);
    res.json({
      ...doc,
      jobOrderCount: stats[doc._id.toString()]?.jobOrderCount || 0,
      outstanding: stats[doc._id.toString()]?.outstanding || 0,
    });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'company', 'phone', 'email', 'address', 'note'];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    const doc = await Customer.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) throw Errors.notFound('Customer not found');
    res.json(doc);
  })
);

router.delete(
  '/:id',
  requireOwner,
  asyncHandler(async (req, res) => {
    const count = await JobOrder.countDocuments({ customer: req.params.id });
    if (count > 0) throw Errors.conflict('Cannot delete customer with job orders');
    const doc = await Customer.findByIdAndDelete(req.params.id);
    if (!doc) throw Errors.notFound('Customer not found');
    res.json({ ok: true });
  })
);

router.get(
  '/:id/job-orders',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { customer: req.params.id };
    const [data, total] = await Promise.all([
      JobOrder.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .select('jobOrderNo date jobNature qtyRequired status invoice')
        .lean(),
      JobOrder.countDocuments(filter),
    ]);
    res.json(paginated(data, total, page, limit));
  })
);

export default router;
