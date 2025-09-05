import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import { Idea } from "@/models/Idea";
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

    // Clear all ideas
    const deletedIdeas = await Idea.deleteMany({});

    // Clear all user keys (optional - you might want to keep these)
    const deletedKeys = await UserKey.deleteMany({});

    res.status(200).json({
      message: "All data cleared successfully",
      deletedIdeas: deletedIdeas.deletedCount,
      deletedKeys: deletedKeys.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing data:", error);
    res.status(500).json({ error: "Failed to clear data" });
  }
}
