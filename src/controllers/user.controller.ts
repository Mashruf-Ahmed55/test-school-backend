import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import envConfig from '../config/envConfig.js';

import User from '../models/user.mode.js';

import { sendEmail } from '../service/sendEmail.service.js';
import { jwtPayload, UserRole } from '../types/type.js';

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return next(createHttpError.BadRequest('All fields are required'));
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createHttpError.Conflict('Email already registered'));
    }

    // Create user
    const newUser = await User.create({
      name,
      email,
      password,
      role: role || UserRole.STUDENT,
    });

    // Generate and send OTP
    newUser.generateOTP();
    await newUser.save();

    const emailData = {
      name: newUser.name,
      otp: newUser.otp,
      expiryMinutes: 10,
      appName: envConfig.appName,
      currentYear: new Date().getFullYear(),
    };
    await sendEmail({
      to: newUser.email,
      subject: 'Verify Your Email',
      template: 'otp-verification',
      data: emailData,
    });

    // Response
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return next(
        createHttpError.BadRequest('Email and password are required')
      );
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(createHttpError.NotFound('User not found'));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createHttpError.Unauthorized('Invalid credentials'));
    }

    // Check email verification
    if (!user.isEmailVerified) {
      return next(createHttpError.Forbidden('Please verify your email first'));
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set secure cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: envConfig.nodeEnv === 'production',
      sameSite: 'none',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: envConfig.nodeEnv === 'production',
      sameSite: 'none',
    });

    // Response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        certificationLevel: user.certificationLevel,
        lastAssessmentDate: user.lastAssessmentDate,
        assessmentAttempts: user.assessmentAttempts,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return next(createHttpError.BadRequest('Email and OTP are required'));
    }

    // Find user
    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user) {
      return next(createHttpError.NotFound('User not found'));
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return next(createHttpError.Conflict('Email already verified'));
    }

    // Verify OTP
    if (!user.otp || user.otp !== otp) {
      return next(createHttpError.Unauthorized('Invalid OTP'));
    }

    // Check OTP expiry
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return next(createHttpError.Gone('OTP has expired'));
    }

    // Update user
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Response
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return next(createHttpError.BadRequest('Email is required'));
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return next(createHttpError.NotFound('User not found'));
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return next(createHttpError.Conflict('Email already verified'));
    }

    // Generate new OTP
    user.generateOTP();
    await user.save();

    const emailData = {
      name: user.name,
      otp: user.otp,
      expiryMinutes: 10,
      appName: envConfig.appName,
      currentYear: new Date().getFullYear(),
    };

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      template: 'otp-verification',
      data: emailData,
    });

    // Response
    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    // Type-safe user from auth middleware
    const { id } = req.user;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return next(createHttpError.NotFound('User not found'));
    }

    // Response
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        certificationLevel: user.certificationLevel,
        lastAssessmentDate: user.lastAssessmentDate,
        assessmentAttempts: user.assessmentAttempts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.cookies;

    // Validation
    if (!refreshToken) {
      return next(createHttpError.Unauthorized('Refresh token required'));
    }

    // Verify token
    const decoded = jwt.verify(
      refreshToken,
      envConfig.jwtRefreshSecret as string
    ) as jwtPayload;

    // Find user with refresh token
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken,
    });
    if (!user) {
      return next(createHttpError.Unauthorized('Invalid refresh token'));
    }

    // Generate new access token
    const newAccessToken = user.generateAccessToken();

    // Response
    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(createHttpError.Unauthorized('Invalid or expired refresh token'));
  }
};

export const logoutUser = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.user;

    // Clear refresh token from DB
    await User.findByIdAndUpdate(id, {
      refreshToken: null,
    });

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // Response
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return next(createHttpError.BadRequest('Email is required'));
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return next(createHttpError.NotFound('User not found'));
    }

    // Generate new OTP
    user.generateOTP();
    await user.save();

    const emailData = {
      name: user.name,
      otp: user.otp,
      expiryMinutes: 10,
      appName: envConfig.appName,
      currentYear: new Date().getFullYear(),
    };

    await sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      template: 'otp-verification',
      data: emailData,
    });

    // Response
    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validation
    if (!email || !otp || !newPassword) {
      return next(
        createHttpError.BadRequest('Email, OTP, and new password are required')
      );
    }

    // Find user
    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user) {
      return next(createHttpError.NotFound('User not found'));
    }

    // Verify OTP
    if (!user.otp || user.otp !== otp) {
      return next(createHttpError.BadRequest('Invalid OTP'));
    }

    // Check if OTP has expired
    if (user.otpExpires && user.otpExpires < new Date()) {
      return next(createHttpError.BadRequest('OTP has expired'));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Response
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
