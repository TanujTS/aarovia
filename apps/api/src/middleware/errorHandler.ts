import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export const createError = (message: string, statusCode: number = 500): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode = 500, message, stack } = err;

  console.error(`Error ${statusCode}: ${message}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(stack);
  }

  res.status(statusCode).json({
    error: {
      message: statusCode === 500 ? 'Internal Server Error' : message,
      ...(process.env.NODE_ENV === 'development' && { stack })
    },
    timestamp: new Date().toISOString(),
    path: req.path
  });
};
