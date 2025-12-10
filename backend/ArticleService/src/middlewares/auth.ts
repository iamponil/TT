import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'changeme';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; name?: string; email?: string };
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Authorization required' });

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { 
      id: payload.id, 
      role: payload.role,
      name: payload.name,
      email: payload.email
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
