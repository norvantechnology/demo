import mongoose from 'mongoose';
import { config } from '../config.js';
import {
  Company,
  User,
  Customer,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  JobOrder,
  ActivityLog,
  ChangeRequest,
  Invoice,
  PayrollRun,
  Holiday,
  Device,
} from '../models/index.js';

const models = [
  Company,
  User,
  Customer,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  JobOrder,
  ActivityLog,
  ChangeRequest,
  Invoice,
  PayrollRun,
  Holiday,
  Device,
];

async function ensureIndexes() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to', mongoose.connection.name);

  for (const Model of models) {
    const result = await Model.syncIndexes();
    const indexes = await Model.collection.indexes();
    console.log(`${Model.modelName}: syncIndexes →`, result.length ? result : 'ok', `(${indexes.length} indexes)`);
  }

  console.log('All indexes applied.');
  await mongoose.disconnect();
}

ensureIndexes().catch((err) => {
  console.error(err);
  process.exit(1);
});
