/**
 * Game Types
 * Type definitions for game features
 */

export interface GameResult {
  score: number;
  points: number;
  duration: number;
  gameType: string;
}

export interface GameConfig {
  energyCost: number;
  pointsMultiplier: number;
  maxEnergy: number;
  energyRegenTime: number; // minutes
}

export interface PlayerStats {
  totalGamesPlayed: number;
  totalScore: number;
  bestScore: number;
  totalPointsEarned: number;
  currentEnergy: number;
  maxEnergy: number;
  lastEnergyUpdate: number;
}

export type GameState = 'idle' | 'playing' | 'paused' | 'gameOver';

export interface GameSession {
  id: string;
  gameType: string;
  startTime: number;
  endTime?: number;
  score: number;
  pointsEarned: number;
  energyUsed: number;
}