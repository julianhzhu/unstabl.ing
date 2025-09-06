import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import UserKey from "@/models/UserKey";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // Store user data with key
    try {
      await runConnectDB();

      const { key, userData } = req.body;

      if (!key || !userData) {
        return res.status(400).json({ error: "Key and user data required" });
      }

      // Store or update user data with the key (merge with existing data)
      await UserKey.findOneAndUpdate(
        { key },
        {
          key,
          $set: {
            "userData.id": userData.id,
            "userData.name": userData.name,
            "userData.key": userData.key,
            lastAccessed: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      res.status(200).json({
        message: "User data stored successfully",
        key: key,
      });
    } catch (error) {
      console.error("Error storing user data:", error);
      res.status(500).json({ error: "Failed to store user data" });
    }
  } else if (req.method === "GET") {
    // Retrieve user data by key
    try {
      await runConnectDB();

      const { key } = req.query;

      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "Key required" });
      }

      const userKeyDoc = await UserKey.findOne({ key });

      if (!userKeyDoc) {
        return res.status(404).json({ error: "Key not found" });
      }

      // Update last accessed time
      userKeyDoc.lastAccessed = new Date();
      await userKeyDoc.save();

      res.status(200).json({
        userData: {
          id: userKeyDoc.userData.id,
          name: userKeyDoc.userData.name,
          key: userKeyDoc.userData.key,
        },
      });
    } catch (error) {
      console.error("Error retrieving user data:", error);
      res.status(500).json({ error: "Failed to retrieve user data" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
