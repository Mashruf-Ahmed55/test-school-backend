import { Router } from 'express';
import {
  getAssessmentHistory,
  startAssessment,
  submitAssessment,
} from '../controllers/assessment.controller.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const assessmentRouter = Router();

assessmentRouter.post('/start-assessment', authenticateUser, startAssessment);

assessmentRouter.post('/submit-assessment', authenticateUser, submitAssessment);

assessmentRouter.get('/history', authenticateUser, getAssessmentHistory);

export default assessmentRouter;
