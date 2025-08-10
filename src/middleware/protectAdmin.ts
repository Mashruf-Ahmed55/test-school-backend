import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        next(createHttpError.Unauthorized('Access token required'));
      }
      if (!roles.includes(req.user.role)) {
        next(createHttpError.Forbidden('Access denied'));
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
