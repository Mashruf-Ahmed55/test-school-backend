import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import transporter from '../config/emailConfig.js';
import envConfig from '../config/envConfig.js';
import SystemLog from '../models/systemLog.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data?: Record<string, any>;
  attachments?: EmailAttachment[];
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const sendEmail = async (
  options: EmailOptions
): Promise<EmailResponse> => {
  const { to, subject, template, data = {}, attachments = [] } = options;

  // Validate required fields
  if (!to || !subject || !template) {
    const error = new Error('Missing required email fields');
    await logEmailError(error, options);
    return {
      success: false,
      error: error.message,
    };
  }

  try {
    // Render HTML template
    const html = await renderEmailTemplate(template, data);

    // Prepare and validate attachments
    const processedAttachments = processAttachments(attachments);

    // Send email
    const info = await transporter.sendMail({
      from: `"${envConfig.appName}" <${envConfig.smtpUser}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      attachments: processedAttachments,
    });

    await logEmailSuccess(info.messageId, options);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: unknown) {
    console.error('Email sending failed:', error);
    await logEmailError(
      error instanceof Error ? error : new Error(String(error)),
      options
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Helper Functions
async function renderEmailTemplate(
  template: string,
  data: Record<string, any>
): Promise<string> {
  const templatePath = path.join(
    __dirname,
    '../views/emails',
    `${template}.ejs`
  );

  return ejs.renderFile(templatePath, {
    ...data,
    appName: envConfig.appName,
    currentYear: new Date().getFullYear(),
    supportEmail: envConfig.supportEmail,
    baseUrl: envConfig.baseUrl,
    logoUrl: envConfig.logoUrl,
  });
}

function processAttachments(attachments: EmailAttachment[]) {
  return attachments.map((attachment) => {
    if (!attachment.filename) {
      throw new Error('Attachment filename is required');
    }

    return {
      ...attachment,
      contentType: attachment.contentType || 'application/octet-stream',
    };
  });
}

async function logEmailSuccess(messageId: string, options: EmailOptions) {
  try {
    await SystemLog.create({
      level: 'info',
      category: 'email',
      message: `Email sent to ${options.to}`,
      metadata: {
        subject: options.subject,
        template: options.template,
        messageId,
      },
    });
  } catch (logError) {
    console.error('Failed to log email success:', logError);
  }
}

async function logEmailError(error: Error, options: EmailOptions) {
  try {
    await SystemLog.create({
      level: 'error',
      category: 'email',
      message: `Failed to send email to ${options.to}`,
      metadata: {
        subject: options.subject,
        template: options.template,
        error: error.message,
        stack: error.stack,
      },
    });
  } catch (logError) {
    console.error('Failed to log email error:', logError);
  }
}
