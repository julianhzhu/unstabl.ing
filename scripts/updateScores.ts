/**
 * Script to update existing ideas with new smart scores
 * Run this once after deploying the new sorting system
 */

import mongoose from "mongoose";
import { Idea } from "../models/Idea";
import { updateIdeaScores, autoCategorizeIdea } from "../lib/sortingAlgorithms";

async function updateAllIdeaScores() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/unstabling"
    );
    console.log("Connected to MongoDB");

    // Get all ideas
    const ideas = await Idea.find({});
    console.log(`Found ${ideas.length} ideas to update`);

    let updated = 0;
    for (const idea of ideas) {
      try {
        // Update scores
        const newScores = updateIdeaScores(idea);

        // Auto-categorize if not already set
        const category =
          idea.category ||
          autoCategorizeIdea(idea.title, idea.content, idea.tags);

        // Update the idea
        await Idea.findByIdAndUpdate(idea._id, {
          $set: {
            ...newScores,
            category,
          },
        });

        updated++;
        console.log(`Updated idea: ${idea.title} (${updated}/${ideas.length})`);
      } catch (error) {
        console.error(`Error updating idea ${idea._id}:`, error);
      }
    }

    console.log(`Successfully updated ${updated} ideas`);
  } catch (error) {
    console.error("Error updating scores:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the update
updateAllIdeaScores();
