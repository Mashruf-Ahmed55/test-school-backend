import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import envConfig from './config/envConfig.js';
import globalErrorHandler from './middleware/globalErrorHandler.js';
import adminRouter from './routes/admin.route.js';
import assessmentRouter from './routes/assessment.route.js';
import questionRouter from './routes/question.route.js';
import userRouter from './routes/user.route.js';

// Improved logging setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDirectory = path.join(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Enhanced log file naming with rotation
const getLogFileName = () => {
  const date = new Date();
  return `access-${date.toISOString().slice(0, 10)}.log`;
};

// Async logging with error handling
const accessLogStream = {
  write: (message: string) => {
    const logFile = path.join(logDirectory, getLogFileName());
    fs.appendFile(logFile, message, { flag: 'a' }, (err) => {
      if (err) console.error('Error writing to log file', err);
    });
  },
};

const app: Application = express();

// Security and middleware configuration
if (envConfig.nodeEnv === 'production') {
  // Enhanced security for production
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
    })
  );

  // More restrictive CORS for production
  app.use(
    cors({
      origin: envConfig.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Production logging
  app.use(
    morgan('combined', {
      stream: accessLogStream,
      skip: (req, res) => req.path === '/health',
    })
  );

  // More aggressive rate limiting in production
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later',
    })
  );
} else {
  // Development configuration
  app.use(
    cors({
      origin: ['http://localhost:5173'],
      credentials: true,
    })
  );
  app.use(morgan('dev'));
}

// Common middleware for all environments
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});

// Main Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/assessments', assessmentRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/questions', questionRouter);

// Error handling middleware (should be the last one)
app.use(globalErrorHandler);

export default app;
