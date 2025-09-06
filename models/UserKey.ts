import mongoose, { Document, Schema } from "mongoose";

export interface IUserKey extends Document {
  key: string;
  userData: {
    id: string;
    name: string;
    key: string;
    email?: string;
    emailVerified?: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    notifications?: {
      email: {
        enabled: boolean;
        onVote: boolean;
        onReply: boolean;
        onReplyToVoted: boolean;
        onReplyToReplied: boolean;
      };
    };
  };
  createdAt: Date;
  lastAccessed: Date;
}

const UserKeySchema = new Schema<IUserKey>({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userData: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    key: { type: String, required: true },
    email: { type: String },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    notifications: {
      email: {
        enabled: { type: Boolean, default: false },
        onVote: { type: Boolean, default: false },
        onReply: { type: Boolean, default: true },
        onReplyToVoted: { type: Boolean, default: false },
        onReplyToReplied: { type: Boolean, default: true },
      },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.UserKey ||
  mongoose.model<IUserKey>("UserKey", UserKeySchema);
