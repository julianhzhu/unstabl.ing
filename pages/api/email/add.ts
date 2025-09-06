import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import UserKey from "@/models/UserKey";
import { sendEmailNotification } from "@/lib/emailService";
import crypto from "crypto";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    await runConnectDB();

    const { key, email } = req.body;

    if (!key || !email) {
      return res.status(400).json({ error: "Key and email are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Find the user
    const userKeyDoc = await UserKey.findOne({ key });
    if (!userKeyDoc) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is already verified for this user
    if (
      userKeyDoc.userData.email === email &&
      userKeyDoc.userData.emailVerified
    ) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with email and verification token

    const updateResult = await UserKey.findOneAndUpdate(
      { key },
      {
        $set: {
          "userData.email": email,
          "userData.emailVerified": false,
          "userData.emailVerificationToken": verificationToken,
          "userData.emailVerificationExpires": verificationExpires,
        },
      },
      { new: true } // Return the updated document
    );

    // Send verification email
    await sendEmailNotification({
      to: email,
      type: "verification",
      data: {
        ideaTitle: "",
        ideaContent: "",
        ideaId: "",
        verificationToken,
      },
    });

    res.status(200).json({
      message:
        "Email added successfully. Please check your inbox to verify your email address.",
    });
  } catch (error) {
    console.error("Error adding email:", error);
    res.status(500).json({ error: "Failed to add email" });
  }
}
