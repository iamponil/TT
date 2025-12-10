import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; [k: string]: any };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: 'Missing authorization header' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({ message: 'Malformed authorization header' });

  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as any;
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const payload = jwt.verify(token, ACCESS_SECRET) as any;
        req.user = { id: payload.id, role: payload.role };
      }
    }
  } catch (err) {
    // ignore
  } finally {
    return next();
  }
};
