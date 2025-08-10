import nodemailer from 'nodemailer';
import envConfig from './envConfig.js';

const transporter = nodemailer.createTransport({
  host: envConfig.smtpHost,
  port: Number(envConfig.smtpPort),
  service: envConfig.smtpService,
  auth: {
    user: envConfig.smtpUser,
    pass: envConfig.smtpPass,
  },
  tls: {
    rejectUnauthorized: envConfig.nodeEnv === 'production',
  },
});

// Test SMTP connection
transporter.verify((error) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send messages');
  }
});
export default transporter;
