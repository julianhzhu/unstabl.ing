import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { runConnectDB } from "@/lib/db";

export type ModifiedReqWithToken = NextApiRequest & {
  token?: string | null | undefined;
  userId?: string;
  twitterId?: string;
  twitterHandle?: string;
  email?: string;
  authProvider?: string;
  consumedInviteCode?: boolean;
};

const withAuth =
  (handler: NextApiHandler) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const modifiedReq: ModifiedReqWithToken = req;

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
      cookieName: "next-auth.session-token",
    });

    if (token && token.userId) {
      // Signed in - add user data to request
      await runConnectDB();
      console.log("User authenticated:", token.userId);

      modifiedReq.token = token.accessToken as string;
      modifiedReq.userId = token.userId as string;
      modifiedReq.twitterId = token.twitterId as string;
      modifiedReq.twitterHandle = token.twitterHandle as string;
      modifiedReq.email = token.email as string;
      modifiedReq.authProvider = token.authProvider as string;
      modifiedReq.consumedInviteCode = token.consumedInviteCode as boolean;
    } else {
      // Not signed in
      console.log("Authentication failed - no valid token");
      if (req.url?.startsWith("/api/")) {
        return res.status(401).json({ error: "Unauthorized" });
      } else {
        res.status(401).redirect("/auth/signin");
        return;
      }
    }

    return handler(modifiedReq, res);
  };

export default withAuth;

