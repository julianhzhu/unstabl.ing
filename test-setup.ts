// Simple test to verify the setup
import { IIdea } from './models/Idea';
import { IUser } from './models/User';

// Test interface compatibility
const testIdea: IIdea = {
  title: "Test Idea",
  content: "Test content",
  author: {
    userId: "test-user",
    twitterHandle: "testuser",
    twitterAvatar: "https://example.com/avatar.jpg",
    name: "Test User"
  },
  votes: {
    stable: [],
    unstable: []
  },
  score: 0,
  tags: [],
  status: "active",
  replies: []
};

const testUser: IUser = {
  authProvider: "twitter",
  privacy: {
    hideHandle: false,
    canTweet: true,
    defaultSnapshotVisibility: "anonymous",
    allowCommunityAggregation: true,
    showInLeaderboards: false
  }
};

console.log("✅ TypeScript setup is working correctly!");
console.log("Test idea:", testIdea.title);
console.log("Test user provider:", testUser.authProvider);

