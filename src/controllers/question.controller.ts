import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import Question from '../models/question.model.js';

// Create question
export const createQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      competency,
      level,
      questionText,
      options,
      correctAnswer,
      explanation,
    } = req.body;

    if (
      !competency ||
      !level ||
      !questionText ||
      !options ||
      correctAnswer === undefined ||
      !explanation
    ) {
      return next(createHttpError.BadRequest('All fields are required'));
    }

    if (options.length !== 4) {
      return next(createHttpError.BadRequest('Exactly 4 options are required'));
    }

    if (correctAnswer < 0 || correctAnswer > 3) {
      return next(
        createHttpError.BadRequest('Correct answer must be between 0 and 3')
      );
    }

    const question = await Question.create({
      competency,
      level,
      questionText,
      options,
      correctAnswer,
      explanation,
    });

    res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

// Get questions
export const getQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { competency, level, page = 1, limit = 10 } = req.query;
    const filter: any = { isActive: true };

    if (competency) filter.competency = competency;
    if (level) filter.level = level;

    const questions = await Question.find(filter)
      .select('-correctAnswer')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Question.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: questions,
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

// Update question
export const updateQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.options && updateData.options.length !== 4) {
      return next(createHttpError.BadRequest('Exactly 4 options are required'));
    }

    if (
      updateData.correctAnswer &&
      (updateData.correctAnswer < 0 || updateData.correctAnswer > 3)
    ) {
      return next(
        createHttpError.BadRequest('Correct answer must be between 0 and 3')
      );
    }

    const question = await Question.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!question) {
      return next(createHttpError.NotFound('Question not found'));
    }

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle question status
export const toggleQuestionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      return next(createHttpError.NotFound('Question not found'));
    }

    question.isActive = !question.isActive;
    await question.save();

    res.status(200).json({
      success: true,
      data: {
        id: question._id,
        isActive: question.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};
