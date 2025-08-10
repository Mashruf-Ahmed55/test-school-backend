import type { NextFunction, Request, Response } from 'express';
import { HttpError } from 'http-errors';

const globalErrorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const stack = err.stack || '';
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' && stack,
  });
};

export default globalErrorHandler;
