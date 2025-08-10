import { NextFunction, Response } from 'express';
import createHttpError from 'http-errors';
import Assessment from '../models/assessment.model.js';
import Question from '../models/question.model.js';
import User from '../models/user.mode.js';
import { CertificationLevel } from '../types/type.js';

// Constants
const QUESTIONS_PER_LEVEL = 44;
const TIME_PER_QUESTION = 60;

// Start assessment
export const startAssessment = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) {
      next(createHttpError.NotFound('User not found'));
    }

    // Highest level check - prevent test if already completed
    if (user?.certificationLevel === CertificationLevel.C2) {
      res.status(400).json({
        success: false,
        message: 'You have already completed the highest certification level.',
      });
    }

    // Determine which step the user should take
    let step = 1;
    let level: CertificationLevel = CertificationLevel.A1;

    if (user?.certificationLevel === CertificationLevel.A2) {
      step = 2;
      level = CertificationLevel.B1;
    } else if (user?.certificationLevel === CertificationLevel.B2) {
      step = 3;
      level = CertificationLevel.C1;
    }

    // Get random questions for the level
    const questions = await Question.aggregate([
      { $match: { level, isActive: true } },
      { $sample: { size: QUESTIONS_PER_LEVEL } },
      { $project: { correctAnswer: 0 } },
    ]);

    // Create assessment record
    const assessment = await Assessment.create({
      user: id,
      step,
      levelTested: level,
      questions: questions.map((q) => q._id),
      answers: [],
      score: 0,
      passed: false,
      startedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      data: {
        assessmentId: assessment._id,
        step,
        level,
        questions,
        timeLimit: QUESTIONS_PER_LEVEL * TIME_PER_QUESTION,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Submit assessment
export const submitAssessment = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user;
    const { assessmentId, answers } = req.body;

    if (!assessmentId || !answers || !Array.isArray(answers)) {
      return next(
        createHttpError.BadRequest('Assessment ID and answers are required')
      );
    }

    const assessment = await Assessment.findById(assessmentId).populate(
      'questions',
      'correctAnswer'
    );

    if (!assessment) {
      return next(createHttpError.NotFound('Assessment not found'));
    }

    if (assessment.user.toString() !== id) {
      return next(createHttpError.Unauthorized());
    }

    if (assessment.completedAt) {
      return next(createHttpError.Conflict('Assessment already submitted'));
    }

    // Calculate score
    let correctCount = 0;
    assessment.questions.forEach((question: any, index: number) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    // Minimum 25% to pass any level
    const score = (correctCount / assessment.questions.length) * 100;
    const passed = score >= 25;

    // Determine certification level based on specs
    let awardedCertification: CertificationLevel | undefined;

    if (assessment.step === 1) {
      if (score >= 75) awardedCertification = CertificationLevel.A2;
      else if (score >= 50) awardedCertification = CertificationLevel.A2;
      else if (score >= 25) awardedCertification = CertificationLevel.A1;
    } else if (assessment.step === 2) {
      if (score >= 75) awardedCertification = CertificationLevel.B2;
      else if (score >= 50) awardedCertification = CertificationLevel.B2;
      else if (score >= 25) awardedCertification = CertificationLevel.B1;
    } else if (assessment.step === 3) {
      if (score >= 50) awardedCertification = CertificationLevel.C2;
      else if (score >= 25) awardedCertification = CertificationLevel.C1;
    }

    // Update assessment
    assessment.answers = answers;
    assessment.score = score;
    assessment.passed = passed;
    assessment.awardedCertification = awardedCertification;
    assessment.completedAt = new Date();
    assessment.timeTaken = Math.floor(
      (new Date().getTime() - assessment.startedAt.getTime()) / 1000
    );

    await assessment.save();

    // Update user if they earned a certification
    if (awardedCertification) {
      await User.findByIdAndUpdate(id, {
        certificationLevel: awardedCertification,
        lastAssessmentDate: new Date(),
        $inc: { assessmentAttempts: 1 },
      });
    } else {
      await User.findByIdAndUpdate(id, {
        lastAssessmentDate: new Date(),
        $inc: { assessmentAttempts: 1 },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        score,
        passed,
        awardedCertification,
        correctAnswers: correctCount,
        totalQuestions: assessment.questions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get assessment history
export const getAssessmentHistory = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user;

    const assessments = await Assessment.find({ user: id })
      .sort({ completedAt: -1 })
      .select('-questions -answers');

    res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    next(error);
  }
};
