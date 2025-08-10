import mongoose, { Model, Schema } from 'mongoose';
import { CertificationLevel, IQuestion } from '../types/type.js';

const questionSchema: Schema<IQuestion> = new Schema(
  {
    competency: {
      type: String,
      required: [true, 'Competency area is required'],
    },
    level: {
      type: String,
      required: [true, 'Certification level is required'],
      enum: Object.values(CertificationLevel),
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: [500, 'Question cannot exceed 500 characters'],
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: (options: string[]) => options.length === 4,
        message: 'There must be exactly 4 options',
      },
    },
    correctAnswer: {
      type: Number,
      required: [true, 'Correct answer index is required'],
      min: [0, 'Correct answer must be between 0 and 3'],
      max: [3, 'Correct answer must be between 0 and 3'],
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
questionSchema.index({ competency: 1, level: 1, isActive: 1 });

const Question: Model<IQuestion> = mongoose.model<IQuestion>(
  'Question',
  questionSchema
);

export default Question;
