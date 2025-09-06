/**
 * Smart sorting algorithms for ideas
 * Inspired by Reddit, Hacker News, and BitcoinTalk
 */

export interface IdeaForSorting {
  _id: string;
  score: number;
  votes: {
    stable: any[];
    unstable: any[];
  };
  replies: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Reddit-style "Hot" algorithm
 * Combines vote score with time decay and engagement
 */
export function calculateHotScore(idea: IdeaForSorting): number {
  const ageInHours = idea.createdAt
    ? (Date.now() - idea.createdAt.getTime()) / (1000 * 60 * 60)
    : 0;
  const timeDecay = Math.pow(ageInHours + 2, -1.5); // Decay factor
  const engagementBoost = Math.log(idea.replies.length + 1) * 0.5;
  const totalVotes = idea.votes.stable.length + idea.votes.unstable.length;
  const voteWeight = Math.log(totalVotes + 1) * 0.3;

  return idea.score * timeDecay + engagementBoost + voteWeight;
}

/**
 * Hacker News style algorithm
 * Emphasizes recent content with vote decay
 */
export function calculateHackerNewsScore(idea: IdeaForSorting): number {
  const ageInHours = idea.createdAt
    ? (Date.now() - idea.createdAt.getTime()) / (1000 * 60 * 60)
    : 0;
  const gravity = 1.8; // HN gravity factor
  const penalty = idea.score < 0 ? 0.5 : 1; // Penalty for negative scores

  return ((idea.score - 1) / Math.pow(ageInHours + 2, gravity)) * penalty;
}

/**
 * Controversial algorithm (BitcoinTalk style)
 * Promotes ideas with high engagement but close vote ratios
 */
export function calculateControversialScore(idea: IdeaForSorting): number {
  const stableVotes = idea.votes.stable.length;
  const unstableVotes = idea.votes.unstable.length;
  const totalVotes = stableVotes + unstableVotes;
  const scoreDiff = Math.abs(stableVotes - unstableVotes);

  // Only consider ideas with significant engagement
  if (totalVotes < 3) return 0;

  // Higher score for more votes with closer ratios
  return totalVotes / (scoreDiff + 1);
}

/**
 * Engagement score
 * Combines replies, votes, and recency
 */
export function calculateEngagementScore(idea: IdeaForSorting): number {
  const totalVotes = idea.votes.stable.length + idea.votes.unstable.length;
  const replyCount = idea.replies.length;
  const ageInHours = idea.createdAt
    ? (Date.now() - idea.createdAt.getTime()) / (1000 * 60 * 60)
    : 0;

  // Recent activity gets a boost
  const recencyBoost = ageInHours < 24 ? 1.5 : ageInHours < 168 ? 1.2 : 1;

  return (totalVotes * 2 + replyCount * 3) * recencyBoost;
}

/**
 * Trending algorithm
 * Identifies ideas gaining momentum recently
 */
export function calculateTrendingScore(idea: IdeaForSorting): number {
  const ageInHours = idea.createdAt
    ? (Date.now() - idea.createdAt.getTime()) / (1000 * 60 * 60)
    : 0;
  const totalVotes = idea.votes.stable.length + idea.votes.unstable.length;
  const replyCount = idea.replies.length;

  // Boost for recent content
  const recencyBoost =
    ageInHours < 6 ? 3 : ageInHours < 24 ? 2 : ageInHours < 72 ? 1.5 : 1;

  // Velocity factor (votes per hour)
  const velocity = totalVotes / Math.max(ageInHours, 1);

  return (velocity + replyCount * 0.5) * recencyBoost;
}

/**
 * Quality score
 * Combines positive votes with engagement quality
 */
export function calculateQualityScore(idea: IdeaForSorting): number {
  const stableVotes = idea.votes.stable.length;
  const unstableVotes = idea.votes.unstable.length;
  const totalVotes = stableVotes + unstableVotes;
  const replyCount = idea.replies.length;

  if (totalVotes === 0) return 0;

  // Positive ratio with engagement
  const positiveRatio = stableVotes / totalVotes;
  const engagementFactor = Math.log(replyCount + 1) * 0.3;

  return positiveRatio * totalVotes + engagementFactor;
}

/**
 * Auto-categorize ideas based on content
 */
export function autoCategorizeIdea(
  title: string,
  content: string,
  tags: string[]
): string {
  const text = `${title} ${content} ${tags.join(" ")}`.toLowerCase();

  // Crypto keywords
  if (
    text.match(
      /\b(bitcoin|crypto|blockchain|defi|nft|token|coin|trading|finance|investment|money|price|market|ethereum|btc|eth)\b/
    )
  ) {
    return "crypto";
  }

  // Tech keywords
  if (
    text.match(
      /\b(software|app|web|mobile|api|database|cloud|server|programming|code|tech|startup|saas|ai|artificial intelligence|machine learning|ml|neural|gpt|chatbot|automation|algorithm)\b/
    )
  ) {
    return "tech";
  }

  return "general";
}

/**
 * Update all scores for an idea
 */
export function updateIdeaScores(idea: IdeaForSorting) {
  return {
    hotScore: calculateHotScore(idea),
    controversialScore: calculateControversialScore(idea),
    engagementScore: calculateEngagementScore(idea),
  };
}
