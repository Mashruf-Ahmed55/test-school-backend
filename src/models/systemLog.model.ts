import mongoose, { Model, Schema } from 'mongoose';
import { ISystemLog, LogCategory, LogLevel } from '../types';

const systemLogSchema: Schema<ISystemLog> = new Schema(
  {
    level: {
      type: String,
      required: true,
      enum: Object.values(LogLevel),
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(LogCategory),
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
systemLogSchema.index({ level: 1 });
systemLogSchema.index({ category: 1 });
systemLogSchema.index({ createdAt: -1 });

const SystemLog: Model<ISystemLog> = mongoose.model<ISystemLog>(
  'SystemLog',
  systemLogSchema
);

export default SystemLog;
