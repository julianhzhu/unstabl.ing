import type { NextApiRequest, NextApiResponse } from "next";
import { runConnectDB } from "@/lib/db";
import { Idea } from "@/models/Idea";
import withAuth, { ModifiedReqWithToken } from "@/lib/withAuth";
import { sendReplyNotification } from "@/lib/notifications";
import {
  autoCategorizeIdea,
  updateIdeaScores,
  calculateHotScore,
} from "@/lib/sortingAlgorithms";

// Only require auth for POST requests
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Allow public access to view ideas
    try {
      await runConnectDB();

      const {
        page = "1",
        limit = "20",
        sort = "trending",
        parentId,
      } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let query: any = {};
      if (parentId) {
        query.parentId = parentId;
      } else {
        query.parentId = { $exists: false }; // Only top-level ideas
      }

      let ideas: any[] = [];

      if (sort === "trending") {
        // For trending, use a smart approach:
        // 1. Get recent ideas (last 7 days) with good engagement
        // 2. Calculate real-time scores for this subset
        // 3. This gives us trending without fetching everything

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const trendingQuery = {
          ...query,
          createdAt: { $gte: sevenDaysAgo },
          $or: [
            { "votes.stable": { $exists: true, $ne: [] } },
            { "votes.unstable": { $exists: true, $ne: [] } },
            { replies: { $exists: true, $ne: [] } },
          ],
        };

        const trendingIdeas = await Idea.find(trendingQuery)
          .sort({ createdAt: -1 })
          .limit(200) // Reasonable limit for trending calculation
          .lean();

        // Calculate real-time hot scores
        const ideasWithScores = trendingIdeas
          .map((idea) => ({
            ...idea,
            realTimeHotScore: calculateHotScore(idea),
          }))
          .sort((a, b) => b.realTimeHotScore - a.realTimeHotScore);

        // Paginate the results
        ideas = ideasWithScores.slice(skip, skip + limitNum);
      } else {
        // For other sorts, use database sorting
        let sortQuery: any = {};
        if (sort === "new") {
          sortQuery = { createdAt: -1 };
        } else if (sort === "controversial") {
          sortQuery = { controversialScore: -1, createdAt: -1 };
        }

        ideas = await Idea.find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(limitNum)
          .lean();
      }

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

      // Auto-categorize the idea
      const category = autoCategorizeIdea(title, content, tags);

      const idea = new Idea({
        title,
        content,
        tags,
        category,
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
        hotScore: 0,
        controversialScore: 0,
        engagementScore: 0,
      });

      await idea.save();

      // If this is a reply, add it to parent's replies array
      if (parentId) {
        const parentIdea = await Idea.findById(parentId);
        if (parentIdea) {
          await Idea.findByIdAndUpdate(parentId, {
            $push: { replies: idea._id },
          });

          // Send reply notifications
          sendReplyNotification(
            parentId,
            idea._id.toString(),
            idea.author.userId,
            idea.author.name || idea.author.twitterHandle || "Anonymous",
            idea.content
          ).catch(console.error); // Don't wait for notifications to complete
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
