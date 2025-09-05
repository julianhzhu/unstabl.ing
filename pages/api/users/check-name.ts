import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import UserKey from "@/models/UserKey";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await runConnectDB();

    const { name, currentUserId } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required" });
    }

    // Check if name is already taken by another user
    const existingUser = await UserKey.findOne({
      "userData.name": name,
      "userData.id": { $ne: currentUserId }, // Exclude current user
    });

    const isAvailable = !existingUser;

    res.status(200).json({
      available: isAvailable,
      name: name,
      message: isAvailable ? "Name is available" : "Name is already taken",
    });
  } catch (error) {
    console.error("Error checking name availability:", error);
    res.status(500).json({ error: "Failed to check name availability" });
  }
}
