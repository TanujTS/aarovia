import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    address: string;
    role: 'patient' | 'provider' | 'admin';
  };
  file?: Express.Multer.File;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(createError('Access token required', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return next(createError('Invalid token', 403));
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};
