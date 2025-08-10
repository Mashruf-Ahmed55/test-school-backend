import { NextFunction, Response } from 'express';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import envConfig from '../config/envConfig';

export const authenticateUser = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.headers.authorization?.split(' ')[1] || req.cookies.accessToken;
    if (!token) {
      next(createHttpError.Unauthorized('Access token required'));
    }
    const decoded = jwt.verify(token, envConfig.jwtAccessSecret as string);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error authenticating user:', error);
    next(error);
  }
};
