import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import Assessment from '../models/assessment.model.js';
import Certificate from '../models/certificate.model.js';
import Question from '../models/question.model.js';
import User from '../models/user.mode.js';

export const getSystemStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAssessments,
      passedAssessments,
      totalCertificates,
      totalQuestions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        lastAssessmentDate: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
      Assessment.countDocuments(),
      Assessment.countDocuments({ passed: true }),
      Certificate.countDocuments(),
      Question.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalAssessments,
        passedAssessments,
        passRate:
          totalAssessments > 0
            ? (passedAssessments / totalAssessments) * 100
            : 0,
        totalCertificates,
        totalQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCertificationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await Assessment.aggregate([
      { $match: { passed: true } },
      {
        $group: {
          _id: '$awardedCertification',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', pageSize = '10' } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(pageSize);

    const users = await User.find()
      .select('-password -refreshToken')
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const total = await User.countDocuments();

    res.status(200).json({
      items: users,
      total,
    });
  } catch (error) {
    next(error);
  }
};

export const manageUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password -refreshToken');

    if (!user) {
      return next(createHttpError.NotFound('User not found'));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionBankStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await Question.aggregate([
      {
        $group: {
          _id: { competency: '$competency', level: '$level' },
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        },
      },
      { $sort: { '_id.level': 1, '_id.competency': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
