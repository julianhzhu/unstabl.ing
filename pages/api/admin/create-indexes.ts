import { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import { Idea } from "@/models/Idea";

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

    const collection = Idea.collection;
    const results: string[] = [];

    console.log("🔍 Creating indexes for optimal performance...");

    // 1. Basic query indexes
    await collection.createIndex({ parentId: 1 });
    results.push("✅ parentId");

    await collection.createIndex({ createdAt: -1 });
    results.push("✅ createdAt (descending)");

    // 2. Trending query optimization
    // Can't index parallel arrays, so we'll use score instead
    await collection.createIndex({ createdAt: -1, score: -1 });
    results.push("✅ createdAt + score (trending)");

    // 3. Controversial sorting
    await collection.createIndex({ controversialScore: -1, createdAt: -1 });
    results.push("✅ controversialScore + createdAt");

    // 4. Engagement scoring
    await collection.createIndex({ engagementScore: -1 });
    results.push("✅ engagementScore");

    // 5. Category filtering
    await collection.createIndex({ category: 1, createdAt: -1 });
    results.push("✅ category + createdAt");

    // 6. Vote queries (individual indexes only - can't compound with parallel arrays)
    await collection.createIndex({ "votes.stable": 1 });
    results.push("✅ votes.stable");

    await collection.createIndex({ "votes.unstable": 1 });
    results.push("✅ votes.unstable");

    // 7. Replies queries
    await collection.createIndex({ replies: 1 });
    results.push("✅ replies");

    // 8. Status filtering
    await collection.createIndex({ status: 1, createdAt: -1 });
    results.push("✅ status + createdAt");

    // 9. Text search
    await collection.createIndex({
      title: "text",
      content: "text",
      tags: "text",
    });
    results.push("✅ text search (title + content + tags)");

    // 10. User-specific queries
    await collection.createIndex({ authorId: 1, createdAt: -1 });
    results.push("✅ authorId + createdAt");

    // Get final index count
    const indexes = await collection.indexes();
    const totalIndexes = indexes.length;

    console.log("🎉 All indexes created successfully!");

    return res.status(200).json({
      success: true,
      message: "Indexes created successfully",
      indexesCreated: results,
      totalIndexes,
      indexDetails: indexes.map((index) => ({
        name: index.name,
        key: index.key,
        unique: index.unique || false,
      })),
    });
  } catch (error) {
    console.error("💥 Index creation failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create indexes",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
