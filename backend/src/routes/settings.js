import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Company, Holiday, Device } from '../models/index.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireOwner } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();

if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(png|jpe?g|webp|svg)$/i.test(file.originalname);
    cb(ok ? null : new Error('Invalid file type'), ok);
  },
});

router.get(
  '/company',
  asyncHandler(async (_req, res) => {
    const doc = await Company.findOne().lean();
    if (!doc) throw Errors.notFound('Company not found');
    res.json(doc);
  })
);

router.patch(
  '/company',
  requireOwner,
  asyncHandler(async (req, res) => {
    const company = await Company.findOne();
    if (!company) throw Errors.notFound('Company not found');
    const allowed = [
      'name',
      'arabicName',
      'address',
      'phone',
      'email',
      'brandColor',
      'invoiceFooterEn',
      'invoiceFooterAr',
      'invoiceDueDays',
    ];
    for (const k of allowed) if (k in (req.body || {})) company[k] = req.body[k];
    if (req.body?.counters) {
      if (req.body.counters.jobOrderNext != null)
        company.counters.jobOrderNext = Number(req.body.counters.jobOrderNext);
      if (req.body.counters.invoiceNext != null)
        company.counters.invoiceNext = Number(req.body.counters.invoiceNext);
      if (req.body.counters.employeeNext != null)
        company.counters.employeeNext = Number(req.body.counters.employeeNext);
    }
    await company.save();
    res.json(company);
  })
);

router.post(
  '/company/logo',
  requireOwner,
  upload.single('logo'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw Errors.validation('Logo file required');
    const company = await Company.findOne();
    if (!company) throw Errors.notFound('Company not found');
    company.logoUrl = `/uploads/${req.file.filename}`;
    await company.save();
    res.json({ logoUrl: company.logoUrl });
  })
);

router.get(
  '/attendance-rules',
  asyncHandler(async (_req, res) => {
    const company = await Company.findOne().select('attendanceRules').lean();
    if (!company) throw Errors.notFound('Company not found');
    res.json(company.attendanceRules);
  })
);

router.patch(
  '/attendance-rules',
  requireOwner,
  asyncHandler(async (req, res) => {
    const company = await Company.findOne();
    if (!company) throw Errors.notFound('Company not found');
    Object.assign(company.attendanceRules, req.body || {});
    await company.save();
    res.json(company.attendanceRules);
  })
);

router.get(
  '/payroll-rules',
  asyncHandler(async (_req, res) => {
    const company = await Company.findOne().select('payrollRules').lean();
    if (!company) throw Errors.notFound('Company not found');
    res.json(company.payrollRules);
  })
);

router.patch(
  '/payroll-rules',
  requireOwner,
  asyncHandler(async (req, res) => {
    const company = await Company.findOne();
    if (!company) throw Errors.notFound('Company not found');
    Object.assign(company.payrollRules, req.body || {});
    await company.save();
    res.json(company.payrollRules);
  })
);

router.get(
  '/holidays',
  asyncHandler(async (_req, res) => {
    const data = await Holiday.find().sort({ date: 1 }).lean();
    res.json({ data });
  })
);

router.post(
  '/holidays',
  requireOwner,
  asyncHandler(async (req, res) => {
    const { name, date, recurring } = req.body || {};
    if (!name || !date) throw Errors.validation('Name and date required');
    const doc = await Holiday.create({ name, date, recurring: !!recurring });
    res.status(201).json(doc);
  })
);

router.delete(
  '/holidays/:id',
  requireOwner,
  asyncHandler(async (req, res) => {
    const doc = await Holiday.findByIdAndDelete(req.params.id);
    if (!doc) throw Errors.notFound('Holiday not found');
    res.json({ ok: true });
  })
);

router.get(
  '/devices',
  asyncHandler(async (_req, res) => {
    const data = await Device.find().sort({ name: 1 }).lean();
    res.json({ data });
  })
);

router.post(
  '/devices',
  requireOwner,
  asyncHandler(async (req, res) => {
    const { name, ip, port } = req.body || {};
    if (!name || !ip) throw Errors.validation('Name and IP required');
    const doc = await Device.create({
      name,
      ip,
      port: port || 4370,
      status: 'inactive',
      lastSyncNote: 'Demo: no live device connected yet',
    });
    res.status(201).json(doc);
  })
);

router.patch(
  '/devices/:id',
  requireOwner,
  asyncHandler(async (req, res) => {
    const update = {};
    for (const k of ['name', 'ip', 'port', 'status']) {
      if (k in (req.body || {})) update[k] = req.body[k];
    }
    const doc = await Device.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) throw Errors.notFound('Device not found');
    res.json(doc);
  })
);

router.post(
  '/devices/:id/sync-now',
  requireOwner,
  asyncHandler(async (req, res) => {
    const doc = await Device.findByIdAndUpdate(
      req.params.id,
      {
        lastSyncAt: new Date(),
        lastSyncNote: 'Demo: no live device connected yet',
      },
      { new: true }
    );
    if (!doc) throw Errors.notFound('Device not found');
    res.json(doc);
  })
);

export default router;
