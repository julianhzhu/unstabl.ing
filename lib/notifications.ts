import { runConnectDB } from "@/lib/db";
import UserKey from "@/models/UserKey";
import { Idea } from "@/models/Idea";
import { sendEmailNotification } from "@/lib/emailService";

export async function sendVoteNotification(
  ideaId: string,
  voterUserId: string,
  voterName: string
) {
  try {
    await runConnectDB();

    // Get the idea
    const idea = await Idea.findById(ideaId);
    if (!idea) return;

    // Get the idea author's user data
    const authorUserKey = await UserKey.findOne({
      "userData.id": idea.author.userId,
    });

    if (!authorUserKey || !authorUserKey.userData.emailVerified) return;

    const notifications = authorUserKey.userData.notifications;
    if (!notifications?.email?.enabled || !notifications.email.onVote) return;

    // Send notification
    await sendEmailNotification({
      to: authorUserKey.userData.email!,
      type: "vote",
      data: {
        ideaTitle: idea.title,
        ideaContent: idea.content,
        ideaId: idea._id.toString(),
        voterName,
      },
    });
  } catch (error) {
    console.error("Error sending vote notification:", error);
  }
}

export async function sendReplyNotification(
  ideaId: string,
  replyId: string,
  replyAuthorUserId: string,
  replyAuthorName: string,
  replyContent: string
) {
  try {
    await runConnectDB();

    // Get the parent idea
    const parentIdea = await Idea.findById(ideaId);
    if (!parentIdea) return;

    // Get the parent idea author's user data
    const parentAuthorUserKey = await UserKey.findOne({
      "userData.id": parentIdea.author.userId,
    });

    // Send notification to parent idea author (if different from reply author)
    if (
      parentAuthorUserKey &&
      parentAuthorUserKey.userData.emailVerified &&
      parentIdea.author.userId !== replyAuthorUserId
    ) {
      const notifications = parentAuthorUserKey.userData.notifications;
      if (notifications?.email?.enabled && notifications.email.onReply) {
        await sendEmailNotification({
          to: parentAuthorUserKey.userData.email!,
          type: "reply",
          data: {
            ideaTitle: parentIdea.title,
            ideaContent: parentIdea.content,
            ideaId: parentIdea._id.toString(),
            authorName: replyAuthorName,
            replyContent,
          },
        });
      }
    }

    // Send notifications to users who voted on the parent idea
    const allVoters = [
      ...parentIdea.votes.stable,
      ...parentIdea.votes.unstable,
    ];
    const uniqueVoterIds = Array.from(new Set(allVoters));

    for (const voterId of uniqueVoterIds) {
      if (
        voterId === replyAuthorUserId ||
        voterId === parentIdea.author.userId
      ) {
        continue; // Skip the reply author and parent author
      }

      const voterUserKey = await UserKey.findOne({
        "userData.id": voterId,
      });

      if (
        voterUserKey &&
        voterUserKey.userData.emailVerified &&
        voterUserKey.userData.notifications?.email?.enabled &&
        voterUserKey.userData.notifications.email.onReplyToVoted
      ) {
        await sendEmailNotification({
          to: voterUserKey.userData.email!,
          type: "replyToVoted",
          data: {
            ideaTitle: parentIdea.title,
            ideaContent: parentIdea.content,
            ideaId: parentIdea._id.toString(),
            authorName: replyAuthorName,
            replyContent,
          },
        });
      }
    }

    // Send notifications to users who replied to the parent idea
    const allReplies = await Idea.find({ parentId: ideaId });
    const uniqueReplyAuthorIds = Array.from(
      new Set(allReplies.map((reply) => reply.author.userId))
    );

    for (const replyAuthorId of uniqueReplyAuthorIds) {
      if (
        replyAuthorId === replyAuthorUserId ||
        replyAuthorId === parentIdea.author.userId
      ) {
        continue; // Skip the current reply author and parent author
      }

      const replyAuthorUserKey = await UserKey.findOne({
        "userData.id": replyAuthorId,
      });

      if (
        replyAuthorUserKey &&
        replyAuthorUserKey.userData.emailVerified &&
        replyAuthorUserKey.userData.notifications?.email?.enabled &&
        replyAuthorUserKey.userData.notifications.email.onReplyToReplied
      ) {
        await sendEmailNotification({
          to: replyAuthorUserKey.userData.email!,
          type: "replyToReplied",
          data: {
            ideaTitle: parentIdea.title,
            ideaContent: parentIdea.content,
            ideaId: parentIdea._id.toString(),
            authorName: replyAuthorName,
            replyContent,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error sending reply notification:", error);
  }
}
