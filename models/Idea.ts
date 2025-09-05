import mongoose, { Model, Schema } from "mongoose";

export interface IIdea {
  _id?: string;
  title: string;
  content: string;
  author: {
    userId: string;
    twitterHandle?: string;
    twitterAvatar?: string;
    name?: string;
  };
  votes: {
    stable: Array<
      string | { userId: string; twitterHandle: string; twitterAvatar: string }
    >; // Array of user IDs or vote objects
    unstable: Array<
      string | { userId: string; twitterHandle: string; twitterAvatar: string }
    >; // Array of user IDs or vote objects
  };
  score: number; // Calculated score (stable votes - unstable votes)
  tags: string[];
  status: "active" | "implemented" | "rejected" | "meme";
  parentId?: string; // For threaded comments
  replies: string[]; // Array of reply idea IDs
  createdAt?: Date;
  updatedAt?: Date;
}

export const ideaSchema = new Schema<IIdea, Model<IIdea>, IIdea>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    author: {
      userId: {
        type: String,
        required: true,
      },
      twitterHandle: String,
      twitterAvatar: String,
      name: String,
    },
    votes: {
      stable: [Schema.Types.Mixed], // Array of user IDs or vote objects
      unstable: [Schema.Types.Mixed], // Array of user IDs or vote objects
    },
    score: {
      type: Number,
      default: 0,
    },
    tags: [String],
    status: {
      type: String,
      enum: ["active", "implemented", "rejected", "meme"],
      default: "active",
    },
    parentId: String, // For threaded comments
    replies: [String], // Array of reply idea IDs
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

// Index for efficient querying
ideaSchema.index({ score: -1, createdAt: -1 });
ideaSchema.index({ parentId: 1 });
ideaSchema.index({ status: 1 });
ideaSchema.index({ "votes.stable": 1 });
ideaSchema.index({ "votes.unstable": 1 });

const Idea: Model<IIdea> =
  mongoose.models?.idea || mongoose.model<IIdea>("idea", ideaSchema);

export { Idea };
