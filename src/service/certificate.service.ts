import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import envConfig from '../config/envConfig.js';
import { CertificationLevel } from '../types/type.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CertificateData {
  userName: string;
  certificationLevel: CertificationLevel;
  date: Date;
  certificateId?: string;
}

interface CertificateResult {
  pdfBuffer: Buffer;
  certificateId: string;
}

export const generateCertificatePDF = async (
  data: CertificateData
): Promise<CertificateResult> => {
  // Generate unique certificate ID if not provided
  const certificateId = data.certificateId || generateCertificateId();

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  // We'll collect the PDF data in a buffer
  const buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));

  // Add background
  const bgPath = path.join(__dirname, '../../assets/certificate-bg.jpg');
  if (fs.existsSync(bgPath)) {
    doc.image(bgPath, 0, 0, { width: 842, height: 595 });
  } else {
    // Fallback background
    doc.rect(0, 0, 842, 595).fill('#f9f9f9');
  }

  // Add decorative border
  doc.strokeColor('#1a5276').lineWidth(15).rect(20, 20, 802, 555).stroke();

  // Add logo (replace with your logo path)
  const logoPath = path.join(__dirname, '../../assets/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 40, { width: 120 });
  }

  // Add certificate title
  doc
    .font('Helvetica-Bold')
    .fontSize(36)
    .fillColor('#1a5276')
    .text('CERTIFICATE OF ACHIEVEMENT', 0, 150, {
      align: 'center',
    });

  // Add certification text
  doc
    .font('Helvetica')
    .fontSize(18)
    .fillColor('#333')
    .text('This is to certify that', 0, 200, {
      align: 'center',
    });

  // Add user name
  doc
    .font('Helvetica-Bold')
    .fontSize(32)
    .fillColor('#1a5276')
    .text(data.userName.toUpperCase(), 0, 230, {
      align: 'center',
    });

  // Add achievement text
  doc
    .font('Helvetica')
    .fontSize(16)
    .fillColor('#333')
    .text(
      'has successfully completed the assessment and demonstrated',
      0,
      280,
      {
        align: 'center',
      }
    );

  // Add certification level
  doc
    .font('Helvetica-Bold')
    .fontSize(24)
    .fillColor('#1a5276')
    .text(`${data.certificationLevel} Digital Competency`, 0, 310, {
      align: 'center',
    });

  // Add date
  doc
    .font('Helvetica')
    .fontSize(14)
    .fillColor('#555')
    .text(`Awarded on: ${formatDate(data.date)}`, 0, 370, {
      align: 'center',
    });

  // Add certificate ID
  doc
    .font('Helvetica-Oblique')
    .fontSize(12)
    .fillColor('#777')
    .text(`Certificate ID: ${certificateId}`, 0, 400, {
      align: 'center',
    });

  // Add signatures area
  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor('#333')
    .text('___________________________', 150, 480)
    .text('Director of Assessments', 150, 500);

  doc
    .text('___________________________', 550, 480)
    .text('Chief Executive Officer', 550, 500);

  // Add security features
  addSecurityFeatures(doc, certificateId);

  // Finalize PDF
  doc.end();

  // Wait for PDF to finish generating
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
  });

  return {
    pdfBuffer,
    certificateId,
  };
};

// Helper functions
function generateCertificateId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TC-${result}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function addSecurityFeatures(doc: PDFKit.PDFDocument, certificateId: string) {
  // Add watermark
  doc
    .opacity(0.1)
    .font('Helvetica-Bold')
    .fontSize(60)
    .fillColor('#1a5276')
    .text('TEST SCHOOL', 50, 200, {
      width: 742,
      align: 'center',
    })
    .opacity(1);

  // Add verification QR code (would need a QR code library in real implementation)
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#1a5276')
    .text(
      'Verify at: ' + `${envConfig.baseUrl}/verify/${certificateId}`,
      50,
      550
    );

  // Add microprint security text
  doc
    .fontSize(4)
    .fillColor('#999')
    .text(`SECURITY::${certificateId}::${Date.now()}::DO_NOT_COPY`, 50, 570, {
      characterSpacing: 0.5,
    });
}
