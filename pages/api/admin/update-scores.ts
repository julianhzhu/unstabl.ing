import { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import { Idea } from "@/models/Idea";
import {
  calculateControversialScore,
  calculateEngagementScore,
  autoCategorizeIdea,
} from "@/lib/sortingAlgorithms";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      error: "Admin API is only available in development mode",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await runConnectDB();

    // Get all ideas
    const ideas = await Idea.find({}).lean();
    console.log(`📊 Found ${ideas.length} ideas to update`);

    let updated = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const idea of ideas) {
      try {
        // Calculate non-time-dependent scores only
        const controversialScore = calculateControversialScore(idea);
        const engagementScore = calculateEngagementScore(idea);

        // Auto-categorize if not already categorized
        const category =
          idea.category ||
          autoCategorizeIdea(idea.title, idea.content, idea.tags || []);

        // Update the idea in database
        await Idea.findByIdAndUpdate(idea._id, {
          controversialScore,
          engagementScore,
          category,
        });

        updated++;
      } catch (error) {
        console.error(`❌ Error updating idea ${idea._id}:`, error);
        errors++;
        errorDetails.push(`Idea ${idea._id}: ${error}`);
      }
    }

    // Get final stats
    const categorizedIdeas = await Idea.countDocuments({
      category: { $exists: true, $ne: null },
    });
    const engagementIdeas = await Idea.countDocuments({
      engagementScore: { $gt: 0 },
    });
    const controversialIdeas = await Idea.countDocuments({
      controversialScore: { $gt: 0 },
    });

    const result = {
      success: true,
      summary: {
        totalIdeas: ideas.length,
        updated,
        errors,
        categorizedIdeas,
        engagementIdeas,
        controversialIdeas,
      },
      errorDetails: errors > 0 ? errorDetails : undefined,
    };

    console.log("🎉 Update complete!", result.summary);

    return res.status(200).json(result);
  } catch (error) {
    console.error("💥 API failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update scores",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
