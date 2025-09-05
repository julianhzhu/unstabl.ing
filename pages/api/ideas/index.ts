import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import { Idea } from "@/models/Idea";
import withAuth, { ModifiedReqWithToken } from "@/lib/withAuth";

// Only require auth for POST requests
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Allow public access to view ideas
    try {
      await runConnectDB();

      const { page = "1", limit = "20", sort = "score", parentId } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let query: any = {};
      if (parentId) {
        query.parentId = parentId;
      } else {
        query.parentId = { $exists: false }; // Only top-level ideas
      }

      let sortQuery: any = {};
      if (sort === "score") {
        sortQuery = { score: -1, createdAt: -1 };
      } else if (sort === "new") {
        sortQuery = { createdAt: -1 };
      } else if (sort === "controversial") {
        sortQuery = {
          $expr: { $abs: { $subtract: ["$votes.stable", "$votes.unstable"] } },
        };
      }

      const ideas = await Idea.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Manually populate replies
      const populateReplies = async (idea: any): Promise<any> => {
        if (idea.replies && idea.replies.length > 0) {
          const replyDocs = await Idea.find({
            _id: { $in: idea.replies },
          })
            .sort({ score: -1, createdAt: -1 }) // Sort replies by vote score, then by recency
            .lean();
          const populatedReplies = await Promise.all(
            replyDocs.map(async (reply) => {
              if (reply.replies && reply.replies.length > 0) {
                return await populateReplies(reply);
              }
              return reply;
            })
          );
          // Return the idea with populated replies array
          return { ...idea, replies: populatedReplies };
        }
        // If no replies, ensure replies is an empty array
        return { ...idea, replies: [] };
      };

      const ideasWithReplies = await Promise.all(
        ideas.map((idea) => populateReplies(idea))
      );

      const total = await Idea.countDocuments(query);

      res.status(200).json({
        ideas: ideasWithReplies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching ideas:", error);
      res.status(500).json({ error: "Failed to fetch ideas" });
    }
  } else if (req.method === "POST") {
    // Allow anonymous posting
    try {
      await runConnectDB();

      const { title, content, tags = [], parentId, author } = req.body;

      if (!title || !content) {
        return res
          .status(400)
          .json({ error: "Title and content are required" });
      }

      if (title.length > 200) {
        return res
          .status(400)
          .json({ error: "Title too long (max 200 chars)" });
      }

      if (content.length > 600) {
        return res
          .status(400)
          .json({ error: "Content too long (max 600 chars)" });
      }

      const idea = new Idea({
        title,
        content,
        tags,
        parentId,
        author: author || {
          userId: "anonymous",
          twitterHandle: author?.name || "DEGEN",
          twitterAvatar: "",
          name: author?.name || "DEGEN",
        },
        votes: {
          stable: [],
          unstable: [],
        },
        score: 0,
      });

      await idea.save();

      // If this is a reply, add it to parent's replies array
      if (parentId) {
        const parentIdea = await Idea.findById(parentId);
        if (parentIdea) {
          await Idea.findByIdAndUpdate(parentId, {
            $push: { replies: idea._id },
          });
        } else {
          console.error(`Parent idea with ID ${parentId} not found`);
        }
      }

      res.status(201).json(idea);
    } catch (error) {
      console.error("Error creating idea:", error);
      res.status(500).json({ error: "Failed to create idea" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
