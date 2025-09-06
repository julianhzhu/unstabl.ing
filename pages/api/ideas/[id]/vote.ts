import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import { Idea } from "@/models/Idea";
import withAuth, { ModifiedReqWithToken } from "@/lib/withAuth";
import { sendVoteNotification } from "@/lib/notifications";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    await runConnectDB();

    const { id } = req.query;
    const { vote, userId, userName, isAnonymous } = req.body; // "stable" or "unstable"

    if (!vote || !["stable", "unstable"].includes(vote)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    // Use atomic operations to handle concurrent votes
    const oppositeVote = vote === "stable" ? "unstable" : "stable";

    // First, try to add the vote atomically
    let updateQuery: any = {};
    let scoreChange = 0;
    let isNewVote = false;

    if (vote === "stable") {
      // Try to add stable vote and remove unstable vote if it exists
      updateQuery = {
        $addToSet: { "votes.stable": userId },
        $pull: { "votes.unstable": userId },
      };
      scoreChange = -1; // Adding bad vote = bad
    } else {
      // Try to add unstable vote and remove stable vote if it exists
      updateQuery = {
        $addToSet: { "votes.unstable": userId },
        $pull: { "votes.stable": userId },
      };
      scoreChange = 1; // Adding good vote = good
    }

    // Try to add the vote first
    const addResult = await Idea.findOneAndUpdate(
      {
        _id: id,
        [`votes.${vote}`]: { $ne: userId }, // Only if user hasn't voted this way
      },
      {
        ...updateQuery,
        $inc: { score: scoreChange },
      },
      { new: true }
    );

    if (addResult) {
      // Successfully added vote
      isNewVote = true;
    } else {
      // User already voted this way, try to remove the vote
      const removeResult = await Idea.findOneAndUpdate(
        {
          _id: id,
          [`votes.${vote}`]: userId, // Only if user has voted this way
        },
        {
          $pull: { [`votes.${vote}`]: userId },
          $inc: { score: vote === "stable" ? 1 : -1 }, // Opposite of adding
        },
        { new: true }
      );

      if (!removeResult) {
        return res
          .status(404)
          .json({ error: "Idea not found or vote state unchanged" });
      }
    }

    const updatedIdea = addResult || (await Idea.findById(id));

    // Send notification if this is a new vote (not removing a vote)
    if (isNewVote) {
      // Only send notification for new votes, not vote removals
      sendVoteNotification(id as string, userId, userName || "Anonymous").catch(
        console.error
      ); // Don't wait for notification to complete
    }

    res.status(200).json(updatedIdea);
  } catch (error) {
    console.error("Error voting on idea:", error);
    res.status(500).json({ error: "Failed to vote on idea" });
  }
}

export default handler;
