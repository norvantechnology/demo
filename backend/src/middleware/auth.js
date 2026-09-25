import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { Errors } from '../utils/errors.js';
import { User } from '../models/User.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, name: user.name },
    config.jwtAccessSecret,
    { expiresIn: config.jwtAccessExpires }
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString() }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpires,
  });
}

function refreshCookieOpts() {
  const isProd = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    // none = works Vercel↔Render cross-origin; lax is fine behind Vercel /api rewrite
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
}

export function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, refreshCookieOpts());
}

export function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', refreshCookieOpts());
}

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw Errors.unauthorized();
    const payload = jwt.verify(token, config.jwtAccessSecret);
    const user = await User.findById(payload.sub).select('name email role active').lean();
    if (!user || !user.active) throw Errors.unauthorized('Account inactive');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(Errors.unauthorized('Invalid or expired token'));
    }
    next(err);
  }
}

export function requireOwner(req, _res, next) {
  if (req.user?.role !== 'owner') return next(Errors.forbidden('Owner access required'));
  next();
}
