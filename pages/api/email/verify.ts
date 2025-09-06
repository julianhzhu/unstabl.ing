import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import UserKey from "@/models/UserKey";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    await runConnectDB();

    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Verification token is required" });
    }

    // Find user with this verification token
    const userKeyDoc = await UserKey.findOne({
      "userData.emailVerificationToken": token,
      "userData.emailVerificationExpires": { $gt: new Date() },
    });

    if (!userKeyDoc) {
      return res.status(400).json({
        error: "Invalid or expired verification token",
      });
    }

    // Verify the email
    await UserKey.findOneAndUpdate(
      { key: userKeyDoc.key },
      {
        $set: {
          "userData.emailVerified": true,
          "userData.emailVerificationToken": null,
          "userData.emailVerificationExpires": null,
        },
      }
    );

    // Redirect to success page or return success response
    res.status(200).json({
      message: "Email verified successfully!",
      verified: true,
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
}
