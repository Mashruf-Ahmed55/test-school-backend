import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose, { Model, Schema } from 'mongoose';
import validator from 'validator';
import envConfig from '../config/envConfig';
import { CertificationLevel, IUser, UserRole } from '../types';

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    certificationLevel: {
      type: String,
      enum: Object.values(CertificationLevel),
      default: CertificationLevel.A1,
    },
    lastAssessmentDate: {
      type: Date,
      default: undefined,
    },
    assessmentAttempts: {
      type: Number,
      default: 0,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Password hashing middleware
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    { id: this._id, role: this.role, email: this.email },
    envConfig.jwtAccessSecret as string,
    {
      expiresIn: '15m',
    }
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    { id: this._id, email: this.email },
    envConfig.jwtRefreshSecret as string,
    {
      expiresIn: '7d',
    }
  );
};

userSchema.methods.generateOTP = function (): void {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
