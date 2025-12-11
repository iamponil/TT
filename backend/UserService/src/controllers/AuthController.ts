import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import {
  createAccessToken,
  createAndStoreRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from '../services/TokenService';
import { validationResult } from 'express-validator';

const COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'refreshToken';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || 'localhost';

class AuthController {
  public async register(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing)
        return res.status(409).json({ message: 'Email already in use' });

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashed });

      return res.status(201).json({
        message: 'User registered',
        user: { id: user._id, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /auth/login
  public async login(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user)
        return res.status(401).json({ message: 'Invalid credentials' });

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res.status(401).json({ message: 'Invalid credentials' });

      // create tokens
      const accessToken = createAccessToken({
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
      });
      const { raw: refreshToken, expiresIn } = await createAndStoreRefreshToken(
        user._id.toString()
      );

      // set HttpOnly cookie
      res.cookie(COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        maxAge: expiresIn * 1000,
        domain: COOKIE_DOMAIN,
      });

      return res.json({
        accessToken,
        user: { 
          id: user._id, 
          name: user.name,
          email: user.email, 
          role: user.role 
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /auth/refresh
  public async refresh(req: Request, res: Response) {
    try {
      const cookie = req.cookies[COOKIE_NAME];
      if (!cookie)
        return res.status(401).json({ message: 'No refresh token provided' });

      const userId = req.body.userId as string;
      if (!userId)
        return res.status(400).json({ message: 'userId required to refresh' });

      const ok = await verifyRefreshToken(userId, cookie);
      if (!ok)
        return res.status(401).json({ message: 'Invalid refresh token' });

      // issue new access token (we can also rotate refresh tokens)
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const accessToken = createAccessToken({
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
      });
      // Optionally rotate refresh token:
      await revokeRefreshToken(userId);
      const { raw: newRefresh, expiresIn } = await createAndStoreRefreshToken(
        userId
      );
      
      res.cookie(COOKIE_NAME, newRefresh, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        maxAge: expiresIn * 1000,
        domain: COOKIE_DOMAIN,
      });

      return res.json({ 
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // POST /auth/logout
  public async logout(req: Request, res: Response) {
    try {
      const cookie = req.cookies[COOKIE_NAME];
      const userId = req.body.userId as string;
      if (userId) {
        await revokeRefreshToken(userId);
      }
      res.clearCookie(COOKIE_NAME, {
        domain: COOKIE_DOMAIN,
        path: '/',
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
      });
      return res.json({ message: 'Logged out' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new AuthController();
