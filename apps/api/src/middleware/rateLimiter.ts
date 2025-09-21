import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // per window

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const clientId = req.ip || 'unknown';
  const currentTime = Date.now();
  
  if (!store[clientId]) {
    store[clientId] = {
      requests: 1,
      resetTime: currentTime + WINDOW_MS
    };
    return next();
  }

  const clientData = store[clientId];

  // Reset if window has expired
  if (currentTime > clientData.resetTime) {
    clientData.requests = 1;
    clientData.resetTime = currentTime + WINDOW_MS;
    return next();
  }

  // Check if limit exceeded
  if (clientData.requests >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((clientData.resetTime - currentTime) / 1000)
    });
  }

  clientData.requests++;
  next();
};
