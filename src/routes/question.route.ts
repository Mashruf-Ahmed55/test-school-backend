import { Router } from 'express';
import {
  createQuestion,
  getQuestions,
  toggleQuestionStatus,
} from '../controllers/question.controller.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const questionRouter = Router();

questionRouter.post('/create', authenticateUser, createQuestion);

questionRouter.get('/questions', authenticateUser, getQuestions);

questionRouter.put('/update-question/:id', authenticateUser, getQuestions);

questionRouter.patch(
  '/toggle-question-status/:id',
  authenticateUser,
  toggleQuestionStatus
);

export default questionRouter;
