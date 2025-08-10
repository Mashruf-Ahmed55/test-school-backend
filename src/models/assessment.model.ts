import mongoose, { Model, Schema } from 'mongoose';
import { CertificationLevel, IAssessment } from '../types';

const assessmentSchema: Schema<IAssessment> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    step: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    levelTested: {
      type: String,
      required: true,
      enum: Object.values(CertificationLevel),
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
      },
    ],
    answers: {
      type: [Number],
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    timeTaken: {
      type: Number,
      min: 0,
    },
    awardedCertification: {
      type: String,
      enum: Object.values(CertificationLevel),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
assessmentSchema.index({ user: 1 });
assessmentSchema.index({ user: 1, step: 1 });
assessmentSchema.index({ levelTested: 1, passed: 1 });

const Assessment: Model<IAssessment> = mongoose.model<IAssessment>(
  'Assessment',
  assessmentSchema
);

export default Assessment;
