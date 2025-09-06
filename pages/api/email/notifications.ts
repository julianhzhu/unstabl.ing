import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import UserKey from "@/models/UserKey";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Get notification preferences
    try {
      await runConnectDB();

      const { key } = req.query;

      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "User key is required" });
      }

      const userKeyDoc = await UserKey.findOne({ key });
      if (!userKeyDoc) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log(
        "Notifications API - userKeyDoc:",
        JSON.stringify(userKeyDoc, null, 2)
      );

      const response = {
        email: userKeyDoc.userData.email,
        emailVerified: userKeyDoc.userData.emailVerified,
        notifications: userKeyDoc.userData.notifications || {
          email: {
            enabled: false,
            onVote: false,
            onReply: true,
            onReplyToVoted: false,
            onReplyToReplied: true,
          },
        },
      };

      console.log(
        "Notifications API - response:",
        JSON.stringify(response, null, 2)
      );
      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch notification preferences" });
    }
  } else if (req.method === "PUT") {
    // Update notification preferences
    try {
      await runConnectDB();

      const { key, notifications } = req.body;

      if (!key) {
        return res.status(400).json({ error: "User key is required" });
      }

      if (!notifications || !notifications.email) {
        return res
          .status(400)
          .json({ error: "Notification preferences are required" });
      }

      const userKeyDoc = await UserKey.findOne({ key });
      if (!userKeyDoc) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update notification preferences
      await UserKey.findOneAndUpdate(
        { key },
        {
          $set: {
            "userData.notifications": notifications,
          },
        }
      );

      res.status(200).json({
        message: "Notification preferences updated successfully",
        notifications,
      });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res
        .status(500)
        .json({ error: "Failed to update notification preferences" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
