#!/usr/bin/env ts-node

/**
 * Script to create optimal database indexes for performance
 * Run with: npx ts-node scripts/createIndexes.ts
 */

import mongoose from "mongoose";
import { Idea } from "../models/Idea";

async function createIndexes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is required");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const collection = Idea.collection;

    console.log("🔍 Creating indexes for optimal performance...");

    // 1. Basic query indexes
    await collection.createIndex({ parentId: 1 });
    console.log("✅ Created index: parentId");

    await collection.createIndex({ createdAt: -1 });
    console.log("✅ Created index: createdAt (descending)");

    // 2. Trending query optimization
    // Can't index parallel arrays, so we'll use separate indexes
    await collection.createIndex({ createdAt: -1, score: -1 });
    console.log("✅ Created compound index: createdAt + score (for trending)");

    // 3. Controversial sorting
    await collection.createIndex({ controversialScore: -1, createdAt: -1 });
    console.log("✅ Created index: controversialScore + createdAt");

    // 4. Engagement scoring
    await collection.createIndex({ engagementScore: -1 });
    console.log("✅ Created index: engagementScore");

    // 5. Category filtering (if we add it back)
    await collection.createIndex({ category: 1, createdAt: -1 });
    console.log("✅ Created index: category + createdAt");

    // 6. Vote queries optimization (individual indexes only)
    // Note: Can't create compound indexes with parallel arrays
    await collection.createIndex({ "votes.stable": 1 });
    console.log("✅ Created index: votes.stable");

    await collection.createIndex({ "votes.unstable": 1 });
    console.log("✅ Created index: votes.unstable");

    // 7. Replies queries
    await collection.createIndex({ replies: 1 });
    console.log("✅ Created index: replies");

    // 8. Status filtering
    await collection.createIndex({ status: 1, createdAt: -1 });
    console.log("✅ Created index: status + createdAt");

    // 9. Text search (for future search functionality)
    await collection.createIndex({
      title: "text",
      content: "text",
      tags: "text",
    });
    console.log("✅ Created text index: title + content + tags");

    // 10. User-specific queries (for user's ideas)
    await collection.createIndex({ authorId: 1, createdAt: -1 });
    console.log("✅ Created index: authorId + createdAt");

    console.log("\n🎉 All indexes created successfully!");
    console.log("\n📊 Index Summary:");
    console.log("   • Basic queries: parentId, createdAt");
    console.log("   • Trending: createdAt + score compound");
    console.log("   • Controversial: controversialScore + createdAt");
    console.log("   • Engagement: engagementScore");
    console.log("   • Categories: category + createdAt");
    console.log("   • Votes: votes.stable, votes.unstable");
    console.log("   • Replies: replies");
    console.log("   • Status: status + createdAt");
    console.log("   • Text search: title + content + tags");
    console.log("   • User content: authorId + createdAt");

    // Show current indexes
    const indexes = await collection.indexes();
    console.log(`\n📋 Total indexes: ${indexes.length}`);

    for (const index of indexes) {
      console.log(`   • ${index.name}: ${JSON.stringify(index.key)}`);
    }
  } catch (error) {
    console.error("💥 Script failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the script
if (require.main === module) {
  createIndexes();
}

export default createIndexes;
