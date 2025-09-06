import mongoose, { Model, Schema } from "mongoose";

export interface IUser {
  _id?: string;
  email?: string;
  name?: string;
  image?: string;
  authProvider: string;
  twitterId?: string;
  twitterHandle?: string;
  twitterAvatar?: string;
  emailVerified?: boolean;
  inviteId?: string;
  consumedInviteCode?: boolean; // Track if user has consumed an invite (grants permanent access)
  privacy: {
    hideHandle: boolean;
    canTweet: boolean;
    defaultSnapshotVisibility: "public" | "anonymous" | "private";
    allowCommunityAggregation: boolean;
    showInLeaderboards: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export const userSchema = new Schema<IUser, Model<IUser>, IUser>(
  {
    email: String,
    name: String,
    image: String,
    authProvider: {
      type: String,
      required: true,
    },
    twitterId: String,
    twitterHandle: String,
    twitterAvatar: String,
    emailVerified: Boolean,
    inviteId: String,
    consumedInviteCode: Boolean, // Track if user has consumed an invite (grants permanent access)

    privacy: {
      hideHandle: {
        type: Boolean,
        default: false,
      },
      canTweet: {
        type: Boolean,
        default: true,
      },
      defaultSnapshotVisibility: {
        type: String,
        enum: ["public", "anonymous", "private"],
        default: "anonymous",
      },
      allowCommunityAggregation: {
        type: Boolean,
        default: true,
      },
      showInLeaderboards: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

const User: Model<IUser> =
  mongoose.models?.user || mongoose.model<IUser>("user", userSchema);

export { User };
