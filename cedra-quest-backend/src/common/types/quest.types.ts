export enum QuestType {
  SOCIAL = 'SOCIAL',
  ONCHAIN = 'ONCHAIN',
}

export enum QuestStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CLAIMED = 'CLAIMED',
}

export enum QuestFrequency {
  ONCE = 'ONCE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

// Match database enum: POINT, XP, SPIN, TOKEN
export enum RewardType {
  POINT = 'POINT',
  XP = 'XP',
  SPIN = 'SPIN',
  TOKEN = 'TOKEN',
}

export interface SocialQuestConfig {
  platform: 'twitter' | 'telegram';
  action: 'follow' | 'like' | 'retweet' | 'join_channel' | 'join_group';
  target_id?: string; // Twitter handle hoặc Telegram channel ID
  url?: string;
}

export interface OnchainQuestConfig {
  chain_id: number;
  contract_address?: string;
  token_symbol?: string;
  min_amount?: string;
  action: 'hold' | 'swap' | 'stake' | 'transfer';
  duration_hours?: number;
}