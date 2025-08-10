import { Router } from 'express';
import {
  getProfile,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendOTP,
  verifyEmail,
} from '../controllers/user.controller.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const userRouter = Router();

userRouter.post('/sign-up', registerUser);
userRouter.post('/verify-email', verifyEmail);
userRouter.post('/resend-otp', resendOTP);
userRouter.post('/sign-in', loginUser);
userRouter.get('/profile', authenticateUser, getProfile);
userRouter.post('/generate-access-token', refreshAccessToken);
userRouter.post('/sign-out', authenticateUser, logoutUser);

export default userRouter;
