import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      authProvider: string;
      twitterId?: string | null;
      twitterHandle?: string | null;
      twitterAvatar?: string | null;
      privacy: {
        hideHandle: boolean;
        canTweet: boolean;
        defaultSnapshotVisibility: "public" | "anonymous" | "private";
        allowCommunityAggregation: boolean;
        showInLeaderboards: boolean;
      };
      consumedInviteCode: boolean;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    authProvider: string;
    twitterId?: string | null;
    twitterHandle?: string | null;
    twitterAvatar?: string | null;
    privacy: {
      hideHandle: boolean;
      canTweet: boolean;
      defaultSnapshotVisibility: "public" | "anonymous" | "private";
      allowCommunityAggregation: boolean;
      showInLeaderboards: boolean;
    };
    consumedInviteCode: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    authProvider?: string;
    twitterId?: string;
    twitterHandle?: string;
    twitterAvatar?: string;
    image?: string | null;
    privacy?: {
      hideHandle: boolean;
      canTweet: boolean;
      defaultSnapshotVisibility: "public" | "anonymous" | "private";
      allowCommunityAggregation: boolean;
      showInLeaderboards: boolean;
    };
    consumedInviteCode?: boolean;
  }
}
