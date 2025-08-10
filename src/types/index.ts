import { JwtPayload } from 'jsonwebtoken';
import mongoose, { Document } from 'mongoose';

// User roles from requirements
export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
  SUPERVISOR = 'supervisor',
}

// Certification levels from requirements
export enum CertificationLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

// Competency areas
export enum CompetencyArea {
  DIGITAL_LITERACY = 'Digital Literacy',
  PROGRAMMING = 'Programming',
  NETWORKING = 'Networking',
  DATABASES = 'Databases',
  CYBERSECURITY = 'Cybersecurity',
  CLOUD_COMPUTING = 'Cloud Computing',
}

// Log levels
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

// Log categories
export enum LogCategory {
  AUTH = 'authentication',
  ASSESSMENT = 'assessment',
  USER = 'user',
  SYSTEM = 'system',
  SECURITY = 'security',
}

// User interface
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isEmailVerified: boolean;
  certificationLevel?: CertificationLevel;
  lastAssessmentDate?: Date;
  assessmentAttempts: number;
  refreshToken?: string;
  otp?: string;
  otpExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateOTP(): void;
}

// JWT payload
export interface jwtPayload extends JwtPayload {
  id: string;
  role: string;
  email: string;
}

// Question interface
export interface IQuestion extends Document {
  competency: CompetencyArea;
  level: CertificationLevel;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Assessment interface
export interface IAssessment extends Document {
  user: mongoose.Types.ObjectId;
  step: number;
  levelTested: CertificationLevel;
  questions: mongoose.Types.ObjectId[];
  answers: number[];
  score: number;
  passed: boolean;
  startedAt: Date;
  completedAt: Date;
  timeTaken: number;
  awardedCertification?: CertificationLevel;
}

// Certificate interface
export interface ICertificate extends Document {
  user: mongoose.Types.ObjectId;
  assessment: mongoose.Types.ObjectId;
  level: CertificationLevel;
  certificateId: string;
  issuedAt: Date;
  expiresAt: Date;
  downloadUrl: string;
  isRevoked: boolean;
  filePath: string;
}

// System log interface
export interface ISystemLog extends Document {
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: any;
  user?: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
}

// Email options
export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

// Email response
export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
