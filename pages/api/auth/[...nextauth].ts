import { runConnectDB } from "@/lib/db";
import clientPromise from "@/lib/mongodb";
import { User } from "@/models/User";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { type NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const options: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID ?? "",
        clientSecret: process.env.TWITTER_CLIENT_SECRET ?? "",
        version: "2.0",
        authorization: {
          params: {
            scope: "users.read tweet.read offline.access",
          },
        },
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60, // 24 hours
    },
    debug: process.env.NODE_ENV === "development",
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider === "twitter") {
          const twitterId = account.providerAccountId;

          // Allow all Twitter users for now (can add invite system later)
          if (twitterId) {
            try {
              await runConnectDB();
              const existing = await User.findOne({
                twitterId: String(twitterId),
              });

              if (existing) {
                return true; // Existing user
              }

              // New user - create with Twitter data
              (user as any).twitterId = account.providerAccountId;
              (user as any).authProvider = account.provider;
              (user as any).consumedInviteCode = true;

              return true;
            } catch (error) {
              console.error("SignIn error:", error);
              return false;
            }
          }
        }
        return false;
      },

      async jwt({ token, account, user }) {
        if (account && user) {
          token.userId = user.id;
          token.authProvider = account.provider;

          if (account.provider === "twitter") {
            token.twitterId = account.providerAccountId;
            token.twitterHandle =
              (user as any).screen_name || (user as any).username;
            token.twitterAvatar = (user as any).profile_image_url_https;
          }

          token.privacy = {
            hideHandle: false,
            canTweet: account.provider === "twitter",
            defaultSnapshotVisibility: "anonymous",
            allowCommunityAggregation: true,
            showInLeaderboards: false,
          };
        }

        // Do heavy database work here
        if (token.authProvider && token.twitterId) {
          try {
            await runConnectDB();
            let dbUser = await User.findOne({ twitterId: token.twitterId });

            if (!dbUser) {
              // Create new user
              dbUser = new User({
                twitterId: token.twitterId,
                twitterHandle: token.twitterHandle,
                twitterAvatar: token.twitterAvatar,
                name: token.name,
                authProvider: token.authProvider,
                consumedInviteCode: true,
                privacy: token.privacy,
              });
              await dbUser.save();
            }

            // Update token with user data
            token.userId = String(dbUser._id);
            token.name = dbUser.name;
            token.image = (dbUser.image as string) || null;
            token.authProvider = dbUser.authProvider;
            token.twitterId = dbUser.twitterId;
            token.twitterHandle = dbUser.twitterHandle;
            token.twitterAvatar = dbUser.twitterAvatar;
            token.privacy = dbUser.privacy;
            token.consumedInviteCode = dbUser.consumedInviteCode;
          } catch (error) {
            console.log("JWT callback error:", error);
          }
        }

        return token;
      },

      async session({ session, token }) {
        if (token && token.userId) {
          session.user = {
            id: token.userId,
            name: token.name || null,
            email: token.email || null,
            image: token.image || null,
            authProvider: token.authProvider || "unknown",
            twitterId: token.twitterId || null,
            twitterHandle: token.twitterHandle || null,
            twitterAvatar: token.twitterAvatar || null,
            privacy: token.privacy || {
              hideHandle: false,
              canTweet: false,
              defaultSnapshotVisibility: "anonymous",
              allowCommunityAggregation: true,
              showInLeaderboards: false,
            },
            consumedInviteCode: token.consumedInviteCode || false,
          };
        }

        return session;
      },
    },
  };

  return await (NextAuth as any)(req, res, options);
}
