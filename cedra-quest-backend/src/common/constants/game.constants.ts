// Pet System Constants
export const PET_CONSTANTS = {
  FEED_COST: 20, // Points per feed
  MAX_DAILY_SPEND: 600, // Max points per day for feeding
  XP_PER_FEED: 20, // XP gained per feed
  XP_FOR_LEVEL_UP: 1200, // XP needed for next level
  MAX_LEVEL: 10, // Maximum pet level
  MAX_CLAIM_HOURS: 4, // Maximum hours for reward accumulation
};

// Energy System Constants
export const ENERGY_CONSTANTS = {
  MAX_ENERGY: 10, // Default max energy
  REGEN_INTERVAL: 30 * 60 * 1000, // 30 minutes in milliseconds
  REGEN_THRESHOLD: 5, // Only regenerate if energy < 5
  ENERGY_PER_GAME: 1, // Energy consumed per game
};

// Game Constants
export const GAME_CONSTANTS = {
  BASE_POINTS_PER_GAME: 0, // No base points - pure score-based rewards
  SCORE_MULTIPLIER: 1.0, // 1 point per score (exact 1:1 ratio)
  MAX_GAME_DURATION: 300, // Max game duration in seconds (5 minutes)
};

// Ranking System Constants
export const RANK_THRESHOLDS = {
  RANK1: 0,
  RANK2: 10000,
  RANK3: 25000,
  RANK4: 45000,
  RANK5: 60000,
  RANK6: 75000,
} as const;

export const RANK_ORDER = ['RANK1', 'RANK2', 'RANK3', 'RANK4', 'RANK5', 'RANK6'] as const;

// Rank Rewards - coins earned when reaching each rank
export const RANK_REWARDS = {
  RANK1: 0,     // No reward for starting rank
  RANK2: 1000,  // 1000 coins when reaching 10,000 points
  RANK3: 2000,  // 2000 coins when reaching 25,000 points
  RANK4: 3000,  // 3000 coins when reaching 45,000 points
  RANK5: 4000,  // 4000 coins when reaching 60,000 points
  RANK6: 5000,  // 5000 coins when reaching 75,000 points
} as const;

// Default Game Cycle (if no active cycle)
export const DEFAULT_CYCLE = {
  cycleNumber: 1,
  growthRate: 0.8,
  maxSpeedCap: 8.0,
  isActive: true,
};

// Blockchain Integration Constants
export const BLOCKCHAIN_CONSTANTS = {
  MIN_CLAIM_AMOUNT: 1000, // Minimum points to record on blockchain
  SIGNATURE_EXPIRY: 5 * 60 * 1000, // Signature valid for 5 minutes
  MAX_NONCE_AGE: 24 * 60 * 60 * 1000, // Nonce valid for 24 hours
  TREASURY_SEED: 'cedra_gamefi_treasury_v1',
  DECIMALS: 8, // CEDRA token decimals
  OCTAS_PER_CEDRA: 100000000, // 10^8
};

// Time Utilities
export const TIME_CONSTANTS = {
  HOUR_IN_MS: 60 * 60 * 1000,
  DAY_IN_MS: 24 * 60 * 60 * 1000,
  MINUTE_IN_MS: 60 * 1000,
};

// Date format for daily tracking
export const DATE_FORMAT = 'YYYY-MM-DD';

// Anti-cheat constants
export const ANTI_CHEAT = {
  MAX_FEEDS_PER_MINUTE: 30, // Max feeds per minute to prevent spam
  MAX_GAMES_PER_MINUTE: 10, // Max games per minute
  MIN_GAME_DURATION: 5, // Minimum game duration in seconds
};