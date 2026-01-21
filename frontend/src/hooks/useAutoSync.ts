/**
 * Auto Sync Hook
 * Provides sync status and controls for the auto-sync service
 */

import { useState, useEffect } from 'react';
import { autoSyncService } from '../services/auto-sync.service';

export interface SyncStatus {
  isInitialized: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  deviceId: string;
  timeSinceLastSync: number;
}

export function useAutoSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isInitialized: false,
    isSyncing: false,
    lastSyncTime: 0,
    deviceId: '',
    timeSinceLastSync: 0,
  });

  // Update sync status every second
  useEffect(() => {
    const updateStatus = () => {
      const status = autoSyncService.getSyncStatus();
      const now = Date.now();
      const timeSinceLastSync = status.lastSyncTime > 0 ? now - status.lastSyncTime : 0;
      
      setSyncStatus({
        ...status,
        timeSinceLastSync,
      });
    };

    // Initial update
    updateStatus();

    // Update every second
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  // Force sync function
  const forceSync = async () => {
    try {
      await autoSyncService.forceSyncNow();
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  };

  // Format time since last sync
  const formatTimeSinceSync = (ms: number): string => {
    if (ms === 0) return 'Never';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
    return `${seconds}s ago`;
  };

  return {
    syncStatus,
    forceSync,
    formatTimeSinceSync: (ms?: number) => formatTimeSinceSync(ms ?? syncStatus.timeSinceLastSync),
    isOnline: syncStatus.isInitialized && !syncStatus.isSyncing,
    isOffline: !syncStatus.isInitialized,
  };
}