import mongoose, { Document, Schema } from "mongoose";

export interface IUserKey extends Document {
  key: string;
  userData: {
    id: string;
    name: string;
    key: string;
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
