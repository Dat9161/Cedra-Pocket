/**
 * Auto Sync Service
 * Automatically synchronizes user data between devices
 */

import { backendAPI } from './backend-api.service';
import type { UserData } from '../models';

export interface SyncData {
  user: UserData;
  lastSyncTime: number;
  deviceId: string;
}

export class AutoSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly DEVICE_ID_KEY = 'device_id';
  private isInitialized = false;
  private isSyncing = false;

  /**
   * Initialize auto-sync service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔄 Initializing Auto-Sync Service...');
    
    // Generate or get device ID
    this.ensureDeviceId();
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Sync on visibility change (when user switches between apps/tabs)
    this.setupVisibilitySync();
    
    // Initial sync
    await this.performSync();
    
    this.isInitialized = true;
    console.log('✅ Auto-Sync Service initialized');
  }

  /**
   * Stop auto-sync service
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isInitialized = false;
    console.log('🛑 Auto-Sync Service stopped');
  }

  /**
   * Generate or retrieve device ID
   */
  private ensureDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Start periodic sync every 30 seconds
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, this.SYNC_INTERVAL);
  }

  /**
   * Setup sync on visibility change
   */
  private setupVisibilitySync(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          // App became visible - sync immediately
          console.log('📱 App became visible, syncing...');
          await this.performSync();
        }
      });
    }
  }

  /**
   * Perform sync operation
   */
  async performSync(): Promise<void> {
    if (this.isSyncing) return; // Prevent concurrent syncs
    
    this.isSyncing = true;
    
    try {
      console.log('🔄 Starting auto-sync...');
      
      // Get local data
      const localData = this.getLocalSyncData();
      if (!localData) {
        console.log('⚠️ No local data to sync');
        this.isSyncing = false;
        return;
      }

      // Check if backend is available
      const backendAvailable = await backendAPI.isBackendAvailable();
      if (!backendAvailable) {
        console.log('⚠️ Backend not available, skipping sync');
        this.isSyncing = false;
        return;
      }

      // Get backend data
      const backendData = await this.getBackendSyncData();
      
      // Determine sync direction
      const syncResult = await this.determineSyncDirection(localData, backendData);
      
      if (syncResult.action === 'push') {
        await this.pushToBackend(localData);
        console.log('⬆️ Data pushed to backend');
      } else if (syncResult.action === 'pull' && backendData) {
        await this.pullFromBackend(backendData);
        console.log('⬇️ Data pulled from backend');
      } else {
        console.log('✅ Data already in sync');
      }
      
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get local sync data
   */
  private getLocalSyncData(): SyncData | null {
    try {
      // Get user data from localStorage using the same key as Zustand persist
      const storedData = localStorage.getItem('tg-mini-app-storage');
      if (!storedData) return null;

      const parsed = JSON.parse(storedData);
      const userData = parsed?.state?.user;
      if (!userData) return null;

      const lastSyncTime = parseInt(localStorage.getItem('last_sync_time') || '0');
      const deviceId = this.ensureDeviceId();

      return {
        user: userData,
        lastSyncTime,
        deviceId,
      };
    } catch (error) {
      console.error('Failed to get local sync data:', error);
      return null;
    }
  }

  /**
   * Get backend sync data
   */
  private async getBackendSyncData(): Promise<SyncData | null> {
    try {
      const backendUser = await backendAPI.getUserProfile();
      
      // Convert backend user to frontend format
      const userData = backendAPI.backendUserToUserData(backendUser);
      
      return {
        user: userData,
        lastSyncTime: new Date(backendUser.updated_at).getTime(),
        deviceId: 'backend',
      };
    } catch (error) {
      console.error('Failed to get backend sync data:', error);
      return null;
    }
  }

  /**
   * Determine sync direction based on timestamps and data comparison
   */
  private async determineSyncDirection(
    localData: SyncData,
    backendData: SyncData | null
  ): Promise<{ action: 'push' | 'pull' | 'none'; reason: string }> {
    
    if (!backendData) {
      return { action: 'push', reason: 'No backend data found' };
    }

    // Compare last update times
    const localUpdateTime = Math.max(
      localData.user.updatedAt.getTime(),
      localData.lastSyncTime
    );
    
    const backendUpdateTime = backendData.lastSyncTime;

    // If local is significantly newer (more than 1 minute), push to backend
    if (localUpdateTime > backendUpdateTime + 60000) {
      return { action: 'push', reason: 'Local data is newer' };
    }

    // If backend is significantly newer (more than 1 minute), pull from backend
    if (backendUpdateTime > localUpdateTime + 60000) {
      return { action: 'pull', reason: 'Backend data is newer' };
    }

    // Compare key data points to detect conflicts
    const hasDataConflict = this.detectDataConflicts(localData.user, backendData.user);
    
    if (hasDataConflict) {
      // In case of conflict, prefer the data with higher token balance
      if (localData.user.tokenBalance > backendData.user.tokenBalance) {
        return { action: 'push', reason: 'Local has higher balance' };
      } else if (backendData.user.tokenBalance > localData.user.tokenBalance) {
        return { action: 'pull', reason: 'Backend has higher balance' };
      }
    }

    return { action: 'none', reason: 'Data is in sync' };
  }

  /**
   * Detect data conflicts between local and backend
   */
  private detectDataConflicts(localUser: UserData, backendUser: UserData): boolean {
    const tolerance = 0.01; // Small tolerance for floating point comparison
    
    return (
      Math.abs(localUser.tokenBalance - backendUser.tokenBalance) > tolerance ||
      Math.abs(localUser.level - backendUser.level) > tolerance ||
      Math.abs(localUser.currentXP - backendUser.currentXP) > tolerance
    );
  }

  /**
   * Push local data to backend
   */
  private async pushToBackend(localData: SyncData): Promise<void> {
    try {
      // Update user points in backend
      await backendAPI.addPoints(localData.user.tokenBalance);
      
      // Update last sync time
      localStorage.setItem('last_sync_time', Date.now().toString());
      
      console.log('✅ Successfully pushed data to backend');
    } catch (error) {
      console.error('❌ Failed to push data to backend:', error);
      throw error;
    }
  }

  /**
   * Pull data from backend to local
   */
  private async pullFromBackend(backendData: SyncData): Promise<void> {
    try {
      // Update localStorage with backend data (same format as Zustand persist)
      const storedData = localStorage.getItem('tg-mini-app-storage');
      let parsedData = storedData ? JSON.parse(storedData) : { state: {}, version: 0 };
      
      // Update user data in the stored state
      parsedData.state.user = backendData.user;
      
      // Save back to localStorage
      localStorage.setItem('tg-mini-app-storage', JSON.stringify(parsedData));
      
      // Update last sync time
      localStorage.setItem('last_sync_time', Date.now().toString());
      
      // Trigger app state update via global function or event
      if (typeof window !== 'undefined') {
        // Try to update app state directly
        const event = new CustomEvent('syncDataUpdated', { 
          detail: { user: backendData.user } 
        });
        window.dispatchEvent(event);
      }
      
      console.log('✅ Successfully pulled data from backend');
    } catch (error) {
      console.error('❌ Failed to pull data from backend:', error);
      throw error;
    }
  }

  /**
   * Force sync now (for manual triggers)
   */
  async forceSyncNow(): Promise<void> {
    console.log('🔄 Force sync requested...');
    await this.performSync();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isInitialized: boolean;
    isSyncing: boolean;
    lastSyncTime: number;
    deviceId: string;
  } {
    return {
      isInitialized: this.isInitialized,
      isSyncing: this.isSyncing,
      lastSyncTime: parseInt(localStorage.getItem('last_sync_time') || '0'),
      deviceId: this.ensureDeviceId(),
    };
  }
}

// Singleton instance
export const autoSyncService = new AutoSyncService();