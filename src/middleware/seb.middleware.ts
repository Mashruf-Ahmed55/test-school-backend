import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import envConfig from '../config/envConfig.js';
import SystemLog from '../models/systemLog.model.js';

// Configure these in your envConfig
const SEB_CONFIG_KEY = envConfig.sebConfigKey;
const SEB_ALLOWED_KEYS =
  envConfig.sebAllowedKeys && envConfig.sebAllowedKeys.split(',');

export const verifySEB = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Check for SEB headers
    const sebConfig = req.headers['x-safeexambrowser-configkeyhash'];
    const sebBrowser = req.headers['user-agent']?.includes('SEB');

    if (!sebConfig || !sebBrowser) {
      await logSecurityEvent(req, 'SEB verification failed - headers missing');
      return next(createHttpError.Forbidden('Safe Exam Browser required'));
    }

    // 2. Verify configuration key
    const hashedKey = crypto
      .createHash('sha256')
      .update(SEB_CONFIG_KEY as string)
      .digest('hex')
      .toUpperCase();

    if (sebConfig !== hashedKey) {
      await logSecurityEvent(
        req,
        'SEB verification failed - invalid config key'
      );
      return next(createHttpError.Forbidden('Invalid SEB configuration'));
    }

    // 3. Verify browser exam key (if using)
    const examKey = req.headers['x-safeexambrowser-examkey'];
    if (examKey && !SEB_ALLOWED_KEYS?.includes(examKey as string)) {
      await logSecurityEvent(req, 'SEB verification failed - invalid exam key');
      return next(createHttpError.Forbidden('Invalid exam key'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

async function logSecurityEvent(req: Request, message: string) {
  await SystemLog.create({
    level: 'security',
    category: 'assessment',
    message,
    user: (req as any).user?.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: {
      headers: {
        sebConfig: req.headers['x-safeexambrowser-configkeyhash'],
        examKey: req.headers['x-safeexambrowser-examkey'],
        userAgent: req.headers['user-agent'],
      },
    },
  });
}
