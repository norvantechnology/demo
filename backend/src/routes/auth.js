import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import {
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  requireAuth,
} from '../middleware/auth.js';
import { config } from '../config.js';
import { Errors } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

function publicUser(u) {
  return { id: u._id, name: u.name, email: u.email, role: u.role };
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw Errors.validation('Email and password required');
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.active) throw Errors.unauthorized('Invalid email or password');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw Errors.unauthorized('Invalid email or password');
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user: publicUser(user) });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) throw Errors.unauthorized();
    let payload;
    try {
      payload = jwt.verify(token, config.jwtRefreshSecret);
    } catch {
      throw Errors.unauthorized('Invalid refresh token');
    }
    const user = await User.findById(payload.sub);
    if (!user || !user.active) throw Errors.unauthorized();
    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  })
);

router.post('/logout', (_req, res) => {
  clearRefreshCookie(res);
  res.json({ ok: true });
});

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  })
);

export default router;
