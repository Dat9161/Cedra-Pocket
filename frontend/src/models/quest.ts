/**
 * Quest-related data models
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

/**
 * Quest type categories
 */
export type QuestType = 'social' | 'daily' | 'achievement' | 'referral';

/**
 * Quest completion status
 */
export type QuestStatus = 'active' | 'claimable' | 'completed' | 'locked';

/**
 * Reward type for quests
 */
export type QuestRewardType = 'token' | 'gem' | 'nft' | 'xp';

/**
 * Reward earned from completing a quest
 */
export interface QuestReward {
  type: QuestRewardType;
  amount: number;
  nftId?: string;
}

/**
 * Quest/task that users can complete
 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  type: QuestType;
  status: QuestStatus;
  progress: number; // 0-100 percentage
  currentValue: number;
  targetValue: number;
  reward: QuestReward;
  expiresAt?: Date;
  url?: string; // External URL for social media quests
}

/**
 * Result of completing a quest
 */
export interface QuestResult {
  success: boolean;
  quest: Quest;
  earnedReward?: QuestReward;
}
