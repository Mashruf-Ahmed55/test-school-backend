import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import SystemLog from '../models/systemLog.model.js';

export const checkExamEnvironment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // In a real implementation, this would verify:
    // - Safe Exam Browser configuration
    // - No suspicious processes running
    // - Screen sharing detection
    // - Webcam monitoring status

    const environmentValid = true; // Placeholder

    if (!environmentValid) {
      await SystemLog.create({
        level: 'warn',
        category: 'security',
        message: 'Invalid exam environment detected',
        user: (req as any).user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return next(createHttpError.Forbidden('Invalid exam environment'));
    }

    res.status(200).json({
      success: true,
      data: { environmentValid },
    });
  } catch (error) {
    next(error);
  }
};

export const logSecurityEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventType, message, metadata } = req.body;

    await SystemLog.create({
      level: 'security',
      category: 'security',
      message: `${eventType}: ${message}`,
      metadata,
      user: (req as any).user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Security event logged',
    });
  } catch (error) {
    next(error);
  }
};

export const getSecurityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 15 } = req.query;

    const logs = await SystemLog.find({ category: 'security' })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await SystemLog.countDocuments({ category: 'security' });

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const checkProcesses = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user;
    // Client should send running processes list
    const clientProcesses: string[] = req.body.processes || [];

    // List of forbidden processes
    const FORBIDDEN_PROCESSES = [
      'teamviewer',
      'anydesk',
      'vnc',
      'remote',
      'cmd',
      'powershell',
      'terminal',
      'regedit',
      'cheatengine',
      'wireshark',
      'fiddler',
    ];

    // Detect forbidden processes
    const detected = clientProcesses.filter((process) =>
      FORBIDDEN_PROCESSES.some((bad) =>
        process.toLowerCase().includes(bad.toLowerCase())
      )
    );

    if (detected.length > 0) {
      await SystemLog.create({
        level: 'security',
        category: 'assessment',
        message: `Forbidden processes detected: ${detected.join(', ')}`,
        user: id,
        metadata: { detectedProcesses: detected },
      });

      return next(
        createHttpError.Forbidden(
          `Forbidden applications running: ${detected.join(', ')}`
        )
      );
    }

    res.status(200).json({
      success: true,
      verified: true,
    });
  } catch (error) {
    next(error);
  }
};

export const checkScreenSharing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Client should send screen sharing status
    const { isSharing, screens } = req.body;

    if (isSharing && screens > 1) {
      await SystemLog.create({
        level: 'security',
        category: 'assessment',
        message: 'Screen sharing detected',
        user: (req as any).user.id,
        metadata: { screens },
      });

      return next(
        createHttpError.Forbidden(
          'Screen sharing not allowed during assessment'
        )
      );
    }

    res.status(200).json({
      success: true,
      verified: true,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyWebcam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Client should send webcam status
    const { hasWebcam, isActive } = req.body;

    if (!hasWebcam) {
      await SystemLog.create({
        level: 'security',
        category: 'assessment',
        message: 'No webcam detected',
        user: (req as any).user.id,
      });
      return next(createHttpError.Forbidden('Webcam required for proctoring'));
    }

    if (!isActive) {
      await SystemLog.create({
        level: 'security',
        category: 'assessment',
        message: 'Webcam not active',
        user: (req as any).user.id,
      });
      return next(createHttpError.Forbidden('Webcam must remain active'));
    }

    res.status(200).json({
      success: true,
      verified: true,
    });
  } catch (error) {
    next(error);
  }
};
