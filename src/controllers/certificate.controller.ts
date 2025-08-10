import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import createHttpError from 'http-errors';
import path from 'path';
import { fileURLToPath } from 'url';
import envConfig from '../config/envConfig.js';

import Assessment from '../models/assessment.model.js';
import Certificate from '../models/certificate.model.js';
import User from '../models/user.mode.js';
import { generateCertificatePDF } from '../service/certificate.service.js';

import { sendEmail } from '../service/sendEmail.service.js';
import { CertificationLevel } from '../types/type.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure certificates directory exists
const CERTIFICATES_DIR = path.join(__dirname, '../../certificates');
if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

export const generateCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const { assessmentId } = req.params;

    // Validate assessment
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      user: userId,
      passed: true,
    }).lean();

    if (!assessment) {
      return next(createHttpError.NotFound('No passed assessment found'));
    }

    if (!assessment.awardedCertification) {
      return next(createHttpError.BadRequest('No certification level awarded'));
    }

    // Check for existing certificate
    const existingCert = await Certificate.findOne({
      assessment: assessmentId,
    });

    if (existingCert) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already exists',
        data: existingCert,
      });
    }

    // Get user details
    const user = await User.findById(userId).lean();
    if (!user) {
      return next(createHttpError.NotFound('User not found'));
    }

    // Generate PDF certificate
    const { pdfBuffer, certificateId } = await generateCertificatePDF({
      userName: user.name,
      certificationLevel: assessment.awardedCertification as CertificationLevel,
      date: assessment.completedAt || new Date(),
    });

    // Save PDF to storage
    const pdfFileName = `${certificateId}.pdf`;
    const pdfPath = path.join(CERTIFICATES_DIR, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Create certificate record
    const certificate = await Certificate.create({
      user: userId,
      assessment: assessmentId,
      level: assessment.awardedCertification,
      certificateId,
      filePath: pdfPath,
      downloadUrl: `${envConfig.baseUrl}/api/v1/certificates/${certificateId}/download`,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    // Prepare email data
    const emailData = {
      appLogo: `${envConfig.baseUrl}/logo.png`,
      appName: envConfig.appName,
      userName: user.name,
      certificationLevel: assessment.awardedCertification,
      certificateId,
      issuedDate: certificate.issuedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      verificationUrl: `${envConfig.baseUrl}/verify/${certificateId}`,
      downloadUrl: certificate.downloadUrl,
      currentYear: new Date().getFullYear(),
      supportEmail: envConfig.supportEmail,
    };

    // Send email with certificate
    await sendEmail({
      to: user.email,
      subject: `Your ${assessment.awardedCertification} Certification from ${envConfig.appName}`,
      template: 'certificate',
      data: emailData,
      attachments: [
        {
          filename: `Certificate_${assessment.awardedCertification}_${certificateId}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Certificate generated and sent successfully',
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { certificateId } = req.params;
    const userId = (req as any).user.id;

    // Verify certificate
    const certificate = await Certificate.findOne({
      certificateId,
      user: userId,
      isRevoked: false,
    });

    if (!certificate) {
      return next(createHttpError.NotFound('Certificate not found or revoked'));
    }

    // Check if file exists
    if (!fs.existsSync(certificate.filePath)) {
      // Regenerate if file missing
      const user = await User.findById(userId).lean();
      if (!user) {
        return next(createHttpError.NotFound('User not found'));
      }

      const { pdfBuffer } = await generateCertificatePDF({
        userName: user.name,
        certificationLevel: certificate.level as CertificationLevel,
        date: certificate.issuedAt,
        certificateId: certificate.certificateId,
      });

      fs.writeFileSync(certificate.filePath, pdfBuffer);
    }

    // Stream the file
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Certificate_${certificate.level}_${certificate.certificateId}.pdf`,
    });

    const fileStream = fs.createReadStream(certificate.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const getUserCertificates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;

    const certificates = await Certificate.find({
      user: userId,
      isRevoked: false,
    })
      .sort({ issuedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      certificateId,
      isRevoked: false,
    })
      .populate('user', 'name email')
      .populate('assessment', 'score completedAt')
      .lean();

    if (!certificate) {
      return next(createHttpError.NotFound('Certificate not found or revoked'));
    }

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        certificate,
        verificationDate: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};
