/**
 * Game Utilities
 * Helper functions for game features
 */

import type { GameResult, GameConfig, PlayerStats } from './types';

// Default game configuration
export const DEFAULT_GAME_CONFIG: GameConfig = {
  energyCost: 1,
  pointsMultiplier: 5,
  maxEnergy: 10,
  energyRegenTime: 30, // 30 minutes
};

// Calculate points from score
export function calculatePoints(score: number, multiplier: number = DEFAULT_GAME_CONFIG.pointsMultiplier): number {
  return score * multiplier;
}

// Check if player has enough energy
export function hasEnoughEnergy(currentEnergy: number, cost: number = DEFAULT_GAME_CONFIG.energyCost): boolean {
  return currentEnergy >= cost;
}

// Calculate energy regeneration
export function calculateEnergyRegen(lastUpdate: number, maxEnergy: number, currentEnergy: number): number {
  if (currentEnergy >= maxEnergy) return currentEnergy;
  
  const now = Date.now();
  const timeDiff = now - lastUpdate;
  const regenInterval = DEFAULT_GAME_CONFIG.energyRegenTime * 60 * 1000; // Convert to milliseconds
  
  const energyToAdd = Math.floor(timeDiff / regenInterval);
  return Math.min(currentEnergy + energyToAdd, maxEnergy);
}

// Format time for display
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Generate unique game session ID
export function generateSessionId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validate game result
export function validateGameResult(result: GameResult): boolean {
  return (
    typeof result.score === 'number' &&
    typeof result.points === 'number' &&
    typeof result.duration === 'number' &&
    typeof result.gameType === 'string' &&
    result.score >= 0 &&
    result.points >= 0 &&
    result.duration >= 0
  );
}

// Calculate player level from total points
export function calculatePlayerLevel(totalPoints: number): number {
  return Math.floor(totalPoints / 1000) + 1;
}

// Get next level threshold
export function getNextLevelThreshold(currentLevel: number): number {
  return currentLevel * 1000;
}

// Calculate experience progress
export function calculateExpProgress(totalPoints: number): { level: number; currentExp: number; nextLevelExp: number; progress: number } {
  const level = calculatePlayerLevel(totalPoints);
  const currentExp = totalPoints % 1000;
  const nextLevelExp = 1000;
  const progress = (currentExp / nextLevelExp) * 100;
  
  return {
    level,
    currentExp,
    nextLevelExp,
    progress,
  };
}

// Storage keys
export const STORAGE_KEYS = {
  PLAYER_STATS: 'pocket_fly_player_stats',
  GAME_CONFIG: 'pocket_fly_game_config',
  BEST_SCORES: 'pocket_fly_best_scores',
} as const;

// Save player stats to localStorage
export function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save player stats:', error);
  }
}

// Load player stats from localStorage
export function loadPlayerStats(): PlayerStats {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load player stats:', error);
  }
  
  // Return default stats
  return {
    totalGamesPlayed: 0,
    totalScore: 0,
    bestScore: 0,
    totalPointsEarned: 0,
    currentEnergy: DEFAULT_GAME_CONFIG.maxEnergy,
    maxEnergy: DEFAULT_GAME_CONFIG.maxEnergy,
    lastEnergyUpdate: Date.now(),
  };
}

// Update player stats after game
export function updatePlayerStats(stats: PlayerStats, result: GameResult): PlayerStats {
  const newStats: PlayerStats = {
    ...stats,
    totalGamesPlayed: stats.totalGamesPlayed + 1,
    totalScore: stats.totalScore + result.score,
    bestScore: Math.max(stats.bestScore, result.score),
    totalPointsEarned: stats.totalPointsEarned + result.points,
    currentEnergy: Math.max(0, stats.currentEnergy - DEFAULT_GAME_CONFIG.energyCost),
    lastEnergyUpdate: Date.now(),
  };
  
  savePlayerStats(newStats);
  return newStats;
}