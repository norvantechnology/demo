import { Router } from 'express';
import { ChangeRequest, JobOrder, ActivityLog } from '../models/index.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireOwner } from '../middleware/auth.js';

const router = Router();

router.patch(
  '/:id/approve',
  requireOwner,
  asyncHandler(async (req, res) => {
    const cr = await ChangeRequest.findById(req.params.id);
    if (!cr) throw Errors.notFound('Change request not found');
    if (cr.status !== 'pending') throw Errors.conflict('Already decided');

    const jo = await JobOrder.findById(cr.entityId);
    if (!jo) throw Errors.notFound('Job order not found');
    Object.assign(jo, cr.changes);
    await jo.save();

    cr.status = 'approved';
    cr.decidedBy = req.user._id;
    cr.decidedAt = new Date();
    await cr.save();

    await ActivityLog.create({
      entityType: 'job_order',
      entityId: jo._id,
      action: 'change_request_approved',
      by: req.user._id,
      meta: { changeRequestId: cr._id, changes: cr.changes },
    });

    res.json(cr);
  })
);

router.patch(
  '/:id/reject',
  requireOwner,
  asyncHandler(async (req, res) => {
    const cr = await ChangeRequest.findById(req.params.id);
    if (!cr) throw Errors.notFound('Change request not found');
    if (cr.status !== 'pending') throw Errors.conflict('Already decided');
    cr.status = 'rejected';
    cr.decidedBy = req.user._id;
    cr.decidedAt = new Date();
    await cr.save();
    res.json(cr);
  })
);

export default router;
