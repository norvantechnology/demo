import { Router } from 'express';
import dayjs from 'dayjs';
import { Invoice, JobOrder, Company, nextCounter, ActivityLog, displayStatus, Customer } from '../models/index.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireOwner } from '../middleware/auth.js';
import { roundKwd } from '../utils/attendance.js';

const router = Router();

function baseStatusFromPaid(total, paid) {
  if (paid <= 0) return 'unpaid';
  if (paid >= total) return 'paid';
  return 'partial';
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip, search } = parsePagination(req.query);
    const statusFilter = req.query.status || 'all';
    const today = dayjs().startOf('day').toDate();
    const filter = {};

    if (search) {
      const asNum = Number(search);
      const customers = await Customer.find({
        $or: [{ name: new RegExp(search, 'i') }, { company: new RegExp(search, 'i') }],
      })
        .select('_id')
        .lean();
      filter.$or = [{ customer: { $in: customers.map((c) => c._id) } }];
      if (!Number.isNaN(asNum) && asNum > 0) filter.$or.push({ invoiceNo: asNum });
    }

    if (statusFilter === 'paid') filter.status = 'paid';
    else if (statusFilter === 'unpaid') filter.status = 'unpaid';
    else if (statusFilter === 'partial') filter.status = 'partial';
    else if (statusFilter === 'open') filter.status = { $ne: 'paid' };
    else if (statusFilter === 'overdue') {
      filter.status = { $ne: 'paid' };
      filter.dueDate = { $lt: today };
      filter.balance = { $gt: 0 };
    }

    const [rows, total, totalsAgg] = await Promise.all([
      Invoice.find(filter)
        .sort({ date: -1, invoiceNo: -1 })
        .skip(skip)
        .limit(limit)
        .select('invoiceNo date dueDate customer jobOrder total paid balance status')
        .populate('customer', 'name company')
        .populate('jobOrder', 'jobOrderNo')
        .lean(),
      Invoice.countDocuments(filter),
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
            paid: { $sum: '$paid' },
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
          },
        },
      ]),
    ]);

    const totals = totalsAgg[0] || { total: 0, paid: 0, outstanding: 0, overdue: 0 };
    const data = rows.map((r) => ({ ...r, displayStatus: displayStatus(r) }));
    res.json({
      ...paginated(data, total, page, limit),
      totals: {
        total: roundKwd(totals.total),
        paid: roundKwd(totals.paid),
        outstanding: roundKwd(totals.outstanding),
        overdue: roundKwd(totals.overdue),
      },
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { jobOrderId, total, dueDate } = req.body || {};
    if (!jobOrderId) throw Errors.validation('Job order is required');
    if (total == null || Number(total) < 0) throw Errors.validation('Total is required');

    const jo = await JobOrder.findById(jobOrderId);
    if (!jo) throw Errors.notFound('Job order not found');
    if (jo.invoice) throw Errors.conflict('Job order already has an invoice');

    const company = await Company.findOne();
    const invoiceNo = await nextCounter(company._id, 'invoiceNext');
    const t = roundKwd(total);
    const due =
      dueDate ||
      dayjs()
        .add(company.invoiceDueDays || 30, 'day')
        .toDate();

    const inv = await Invoice.create({
      invoiceNo,
      date: new Date(),
      dueDate: due,
      customer: jo.customer,
      jobOrder: jo._id,
      total: t,
      paid: 0,
      balance: t,
      status: 'unpaid',
      payments: [],
      companyId: company._id,
    });

    jo.invoice = inv._id;
    await jo.save();
    await ActivityLog.create({
      entityType: 'job_order',
      entityId: jo._id,
      action: 'invoice_created',
      by: req.user._id,
      meta: { invoiceNo },
    });

    const populated = await Invoice.findById(inv._id)
      .populate('customer', 'name company')
      .populate('jobOrder', 'jobOrderNo')
      .lean();
    res.status(201).json(populated);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('jobOrder', 'jobOrderNo jobNature')
      .lean();
    if (!doc) throw Errors.notFound('Invoice not found');
    res.json({ ...doc, displayStatus: displayStatus(doc) });
  })
);

router.post(
  '/:id/payments',
  asyncHandler(async (req, res) => {
    const { amount, date, method, note } = req.body || {};
    if (!amount || Number(amount) <= 0) throw Errors.validation('Amount is required');
    const inv = await Invoice.findById(req.params.id);
    if (!inv) throw Errors.notFound('Invoice not found');

    const amt = roundKwd(amount);
    inv.payments.push({
      amount: amt,
      date: date || new Date(),
      method: method || 'Cash',
      note,
    });
    inv.paid = roundKwd(inv.paid + amt);
    inv.balance = roundKwd(Math.max(0, inv.total - inv.paid));
    inv.status = baseStatusFromPaid(inv.total, inv.paid);
    await inv.save();

    const populated = await Invoice.findById(inv._id)
      .populate('customer')
      .populate('jobOrder', 'jobOrderNo')
      .lean();
    res.json({ ...populated, displayStatus: displayStatus(populated) });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const update = {};
    if (req.body?.dueDate) update.dueDate = req.body.dueDate;
    const doc = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('customer')
      .populate('jobOrder', 'jobOrderNo');
    if (!doc) throw Errors.notFound('Invoice not found');
    res.json({ ...doc.toObject(), displayStatus: displayStatus(doc) });
  })
);

router.delete(
  '/:id',
  requireOwner,
  asyncHandler(async (req, res) => {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) throw Errors.notFound('Invoice not found');
    if (inv.payments?.length) throw Errors.conflict('Cannot delete invoice with payments');
    await JobOrder.findByIdAndUpdate(inv.jobOrder, { $unset: { invoice: 1 } });
    await inv.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
