import { Router } from 'express';
import { Employee, AttendanceRecord, PayrollRun, Company, nextCounter } from '../models/index.js';
import { parsePagination, paginated } from '../utils/pagination.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireOwner } from '../middleware/auth.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip, search } = parsePagination(req.query);
    const status = req.query.status || 'active';
    const jobTitle = (req.query.jobTitle || '').trim();
    const filter = {};
    if (status !== 'all') filter.status = status;
    if (jobTitle) filter.jobTitle = jobTitle;
    if (search) {
      const q = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: q },
        { arabicName: q },
        { phone: q },
        { deviceId: q },
        { jobTitle: q },
        { civilId: q },
        { employeeNo: q },
      ];
    }
    const [data, total, activeCount, inactiveCount] = await Promise.all([
      Employee.find(filter)
        .sort({ employeeNo: 1 })
        .skip(skip)
        .limit(limit)
        .select(
          'employeeNo name arabicName jobTitle phone deviceId civilId hireDate basicSalaryKwd status note'
        )
        .lean(),
      Employee.countDocuments(filter),
      Employee.countDocuments({ status: 'active' }),
      Employee.countDocuments({ status: 'inactive' }),
    ]);
    const jobTitles = await Employee.distinct('jobTitle', {
      jobTitle: { $nin: [null, ''] },
    });
    res.json({
      ...paginated(data, total, page, limit),
      activeCount,
      inactiveCount,
      jobTitles: jobTitles.filter(Boolean).sort(),
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.name?.trim()) throw Errors.validation('Name is required', { name: 'required' });
    if (!body.hireDate) throw Errors.validation('Hire date is required', { hireDate: 'required' });
    if (body.basicSalaryKwd == null)
      throw Errors.validation('Basic salary is required', { basicSalaryKwd: 'required' });

    const company = await Company.findOne();
    if (!company) throw Errors.notFound('Company not found');
    const next = await nextCounter(company._id, 'employeeNext');
    const employeeNo = String(next).padStart(4, '0');

    const doc = await Employee.create({
      employeeNo,
      name: body.name.trim(),
      arabicName: body.arabicName,
      jobTitle: body.jobTitle,
      phone: body.phone,
      deviceId: body.deviceId,
      civilId: body.civilId,
      hireDate: body.hireDate,
      basicSalaryKwd: body.basicSalaryKwd,
      status: body.status || 'active',
      note: body.note,
      companyId: company._id,
    });
    res.status(201).json(doc);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await Employee.findById(req.params.id).lean();
    if (!doc) throw Errors.notFound('Employee not found');
    res.json(doc);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const allowed = [
      'name',
      'arabicName',
      'jobTitle',
      'phone',
      'deviceId',
      'civilId',
      'hireDate',
      'basicSalaryKwd',
      'status',
      'note',
    ];
    const update = {};
    for (const k of allowed) if (k in (req.body || {})) update[k] = req.body[k];
    const doc = await Employee.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) throw Errors.notFound('Employee not found');
    res.json(doc);
  })
);

router.delete(
  '/:id',
  requireOwner,
  asyncHandler(async (req, res) => {
    const hasHistory =
      (await AttendanceRecord.exists({ employee: req.params.id })) ||
      (await PayrollRun.exists({ 'lines.employee': req.params.id }));
    if (hasHistory) {
      const doc = await Employee.findByIdAndUpdate(
        req.params.id,
        { status: 'inactive' },
        { new: true }
      );
      if (!doc) throw Errors.notFound('Employee not found');
      return res.json(doc);
    }
    const doc = await Employee.findByIdAndDelete(req.params.id);
    if (!doc) throw Errors.notFound('Employee not found');
    res.json({ ok: true });
  })
);

export default router;
