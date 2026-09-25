import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import customersRoutes from './routes/customers.js';
import employeesRoutes from './routes/employees.js';
import attendanceRoutes from './routes/attendance.js';
import leavesRoutes from './routes/leaves.js';
import jobOrdersRoutes from './routes/jobOrders.js';
import changeRequestsRoutes from './routes/changeRequests.js';
import invoicesRoutes from './routes/invoices.js';
import payrollRoutes from './routes/payroll.js';
import settingsRoutes from './routes/settings.js';

const app = express();

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = Array.isArray(config.clientOrigin)
        ? config.clientOrigin
        : [config.clientOrigin];
      if (allowed.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(config.uploadDir));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

app.use('/api', requireAuth);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/job-orders', jobOrdersRoutes);
app.use('/api/change-requests', changeRequestsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

async function start() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});
