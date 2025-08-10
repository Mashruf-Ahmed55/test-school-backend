import mongoose, { Model, Schema } from 'mongoose';
import { CertificationLevel, ICertificate } from '../types';

const certificateSchema: Schema<ICertificate> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assessment: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
    },
    level: {
      type: String,
      required: true,
      enum: Object.values(CertificationLevel),
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    downloadUrl: {
      type: String,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    filePath: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
certificateSchema.index({ user: 1 });
certificateSchema.index({ level: 1, issuedAt: -1 });

const Certificate: Model<ICertificate> = mongoose.model<ICertificate>(
  'Certificate',
  certificateSchema
);

export default Certificate;
