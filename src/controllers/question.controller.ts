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
    const { competency, levels, page = '1', pageSize = '10' } = req.query;

    const filter: any = { isActive: true };

    if (competency) filter.competency = competency;

    // levels expected as comma separated string or array (depending on frontend)
    // So normalize it:
    if (levels) {
      // levels can be string or array from query params, normalize to array
      const levelsArray = Array.isArray(levels)
        ? levels
        : (levels as string).split(',');

      filter.level = { $in: levelsArray };
    }

    const pageNumber = Number(page);
    const limitNumber = Number(pageSize);

    // Query questions with pagination and filter, exclude 'correctAnswer'
    const questions = await Question.find(filter)
      .select('-correctAnswer')
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const total = await Question.countDocuments(filter);

    // Respond with shape frontend expects
    res.status(200).json({
      items: questions,
      total,
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
