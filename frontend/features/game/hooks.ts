/**
 * Game Hooks
 * Custom React hooks for game features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PlayerStats, GameResult, GameSession } from './types';
import { 
  loadPlayerStats, 
  updatePlayerStats, 
  calculateEnergyRegen,
  generateSessionId,
  validateGameResult,
  DEFAULT_GAME_CONFIG
} from './utils';

// Hook for managing player stats and energy
export function usePlayerStats() {
  const [stats, setStats] = useState<PlayerStats>(loadPlayerStats);
  const energyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update energy periodically
  useEffect(() => {
    const updateEnergy = () => {
      setStats(currentStats => {
        const newEnergy = calculateEnergyRegen(
          currentStats.lastEnergyUpdate,
          currentStats.maxEnergy,
          currentStats.currentEnergy
        );
        
        if (newEnergy !== currentStats.currentEnergy) {
          const updatedStats = {
            ...currentStats,
            currentEnergy: newEnergy,
            lastEnergyUpdate: Date.now(),
          };
          
          // Save to localStorage
          try {
            localStorage.setItem('pocket_fly_player_stats', JSON.stringify(updatedStats));
          } catch (error) {
            console.error('Failed to save stats:', error);
          }
          
          return updatedStats;
        }
        
        return currentStats;
      });
    };

    // Update immediately
    updateEnergy();
    
    // Set up periodic updates every minute
    energyTimerRef.current = setInterval(updateEnergy, 60000);

    return () => {
      if (energyTimerRef.current) {
        clearInterval(energyTimerRef.current);
      }
    };
  }, []);

  // Function to consume energy and update stats after game
  const completeGame = useCallback((result: GameResult) => {
    if (!validateGameResult(result)) {
      console.error('Invalid game result:', result);
      return false;
    }

    setStats(currentStats => {
      const newStats = updatePlayerStats(currentStats, result);
      return newStats;
    });

    return true;
  }, []);

  // Function to check if player can start a game
  const canStartGame = useCallback(() => {
    return stats.currentEnergy >= DEFAULT_GAME_CONFIG.energyCost;
  }, [stats.currentEnergy]);

  // Function to get time until next energy
  const getTimeUntilNextEnergy = useCallback(() => {
    if (stats.currentEnergy >= stats.maxEnergy) return 0;
    
    const timeSinceLastUpdate = Date.now() - stats.lastEnergyUpdate;
    const regenInterval = DEFAULT_GAME_CONFIG.energyRegenTime * 60 * 1000;
    const timeUntilNext = regenInterval - (timeSinceLastUpdate % regenInterval);
    
    return Math.ceil(timeUntilNext / 1000); // Return seconds
  }, [stats.currentEnergy, stats.maxEnergy, stats.lastEnergyUpdate]);

  return {
    stats,
    completeGame,
    canStartGame,
    getTimeUntilNextEnergy,
  };
}

// Hook for managing game sessions
export function useGameSession() {
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const startSession = useCallback((gameType: string) => {
    const session: GameSession = {
      id: generateSessionId(),
      gameType,
      startTime: Date.now(),
      score: 0,
      pointsEarned: 0,
      energyUsed: DEFAULT_GAME_CONFIG.energyCost,
    };

    setCurrentSession(session);
    setIsPlaying(true);
    
    return session;
  }, []);

  const endSession = useCallback((score: number, pointsEarned: number) => {
    if (!currentSession) return null;

    const endedSession: GameSession = {
      ...currentSession,
      endTime: Date.now(),
      score,
      pointsEarned,
    };

    setCurrentSession(endedSession);
    setIsPlaying(false);

    return endedSession;
  }, [currentSession]);

  const cancelSession = useCallback(() => {
    setCurrentSession(null);
    setIsPlaying(false);
  }, []);

  return {
    currentSession,
    isPlaying,
    startSession,
    endSession,
    cancelSession,
  };
}

// Hook for game performance tracking
export function useGamePerformance() {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(0);
  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const fpsUpdateTimeRef = useRef(performance.now());

  const updatePerformance = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastFrameTimeRef.current;
    
    setFrameTime(deltaTime);
    frameCountRef.current++;
    
    // Update FPS every second
    if (now - fpsUpdateTimeRef.current >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / (now - fpsUpdateTimeRef.current));
      setFps(currentFps);
      
      frameCountRef.current = 0;
      fpsUpdateTimeRef.current = now;
    }
    
    lastFrameTimeRef.current = now;
  }, []);

  return {
    fps,
    frameTime,
    updatePerformance,
  };
}

// Hook for game audio (placeholder for future implementation)
export function useGameAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const playSound = useCallback((soundName: string) => {
    if (isMuted) return;
    
    // Placeholder for sound playing logic
    console.log(`Playing sound: ${soundName} at volume ${volume}`);
  }, [isMuted, volume]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    isMuted,
    volume,
    setVolume,
    playSound,
    toggleMute,
  };
}