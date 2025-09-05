import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import { Idea } from "@/models/Idea";
import withAuth, { ModifiedReqWithToken } from "@/lib/withAuth";

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

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({ error: "Idea not found" });
    }

    const oppositeVote = vote === "stable" ? "unstable" : "stable";

    // Check if user already voted
    const hasVotedStable = idea.votes.stable.includes(userId);
    const hasVotedUnstable = idea.votes.unstable.includes(userId);

    let updateQuery: any = {};
    let scoreChange = 0;

    if (vote === "stable") {
      if (hasVotedStable) {
        // Remove stable vote (BAD vote removed = GOOD)
        updateQuery.$pull = { "votes.stable": userId };
        scoreChange = 1; // Removing bad vote = good
      } else {
        // Add stable vote (BAD vote added = BAD)
        updateQuery.$addToSet = { "votes.stable": userId };
        scoreChange = -1; // Adding bad vote = bad

        // Remove unstable vote if exists
        if (hasVotedUnstable) {
          updateQuery.$pull = {
            ...updateQuery.$pull,
            "votes.unstable": userId,
          };
          scoreChange -= 1; // Net change is -2 (add bad, remove good)
        }
      }
    } else {
      if (hasVotedUnstable) {
        // Remove unstable vote (GOOD vote removed = BAD)
        updateQuery.$pull = { "votes.unstable": userId };
        scoreChange = -1; // Removing good vote = bad
      } else {
        // Add unstable vote (GOOD vote added = GOOD)
        updateQuery.$addToSet = { "votes.unstable": userId };
        scoreChange = 1; // Adding good vote = good

        // Remove stable vote if exists
        if (hasVotedStable) {
          updateQuery.$pull = { ...updateQuery.$pull, "votes.stable": userId };
          scoreChange += 1; // Net change is +2 (add good, remove bad)
        }
      }
    }

    // Update the idea
    const updatedIdea = await Idea.findByIdAndUpdate(
      id,
      {
        ...updateQuery,
        $inc: { score: scoreChange },
      },
      { new: true }
    );

    res.status(200).json(updatedIdea);
  } catch (error) {
    console.error("Error voting on idea:", error);
    res.status(500).json({ error: "Failed to vote on idea" });
  }
}

export default handler;
