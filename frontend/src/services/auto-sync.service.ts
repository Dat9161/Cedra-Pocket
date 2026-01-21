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
  private readonly SYNC_INTERVAL = 5000; // Giảm xuống 5s để sync cực nhanh
  private readonly DEVICE_ID_KEY = 'device_id';
  private isInitialized = false;
  private isSyncing = false;
  private lastSyncAttempt = 0;
  private readonly MIN_SYNC_INTERVAL = 2000; // Tối thiểu 2s giữa các lần sync

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
   * Perform sync operation with rate limiting
   */
  async performSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('🔄 Sync already in progress, skipping...');
      return;
    }
    
    // Rate limiting - không sync quá thường xuyên
    const now = Date.now();
    if (now - this.lastSyncAttempt < this.MIN_SYNC_INTERVAL) {
      console.log('🔄 Rate limited, skipping sync...');
      return;
    }
    
    this.isSyncing = true;
    this.lastSyncAttempt = now;
    
    try {
      console.log('🔄 Starting auto-sync...');
      
      // Get local data
      const localData = this.getLocalSyncData();
      if (!localData) {
        console.log('⚠️ No local data to sync');
        return;
      }

      // Check if backend is available với timeout ngắn
      const backendAvailable = await Promise.race([
        backendAPI.isBackendAvailable(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)) // 3s timeout
      ]);
      
      if (!backendAvailable) {
        console.log('⚠️ Backend not available, skipping sync');
        return;
      }

      // Get backend data với timeout
      const backendData = await Promise.race([
        this.getBackendSyncData(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)) // 5s timeout
      ]);
      
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
      
      // Update last successful sync time
      localStorage.setItem('last_sync_time', Date.now().toString());
      
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
      // Don't throw - let the app continue working offline
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

    const localBalance = localData.user.tokenBalance;
    const backendBalance = backendData.user.tokenBalance;
    const balanceDiff = Math.abs(localBalance - backendBalance);
    
    // Nếu chênh lệch nhỏ (< 10 points), coi như đã sync
    if (balanceDiff < 10) {
      return { action: 'none', reason: 'Balances are similar (difference < 10)' };
    }

    // Compare last update times
    const localUpdateTime = Math.max(
      localData.user.updatedAt.getTime(),
      localData.lastSyncTime
    );
    
    const backendUpdateTime = backendData.lastSyncTime;
    const timeDiff = Math.abs(localUpdateTime - backendUpdateTime);

    // Nếu thời gian gần nhau (< 30s) nhưng balance khác nhau
    if (timeDiff < 30000) {
      // Ưu tiên balance cao hơn để tránh mất points
      if (localBalance > backendBalance) {
        return { action: 'push', reason: `Local balance higher (${localBalance} vs ${backendBalance})` };
      } else if (backendBalance > localBalance) {
        return { action: 'pull', reason: `Backend balance higher (${backendBalance} vs ${localBalance})` };
      }
    }

    // Nếu local data mới hơn đáng kể (> 1 phút)
    if (localUpdateTime > backendUpdateTime + 60000) {
      return { action: 'push', reason: 'Local data is significantly newer' };
    }

    // Nếu backend data mới hơn đáng kể (> 1 phút)
    if (backendUpdateTime > localUpdateTime + 60000) {
      return { action: 'pull', reason: 'Backend data is significantly newer' };
    }

    // Trường hợp mặc định: ưu tiên balance cao hơn
    if (localBalance > backendBalance) {
      return { action: 'push', reason: 'Local balance is higher' };
    } else if (backendBalance > localBalance) {
      return { action: 'pull', reason: 'Backend balance is higher' };
    }

    return { action: 'none', reason: 'Data is in sync' };
  }

  /**
   * Push local data to backend với logic cải tiến
   */
  private async pushToBackend(localData: SyncData): Promise<void> {
    try {
      // Get current backend user để so sánh chính xác
      const backendUser = await Promise.race([
        backendAPI.getUserProfile(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      const currentBackendTotal = Number(backendUser.total_points);
      const localTotal = localData.user.tokenBalance;
      
      // Tính toán chênh lệch cần sync
      const pointsToAdd = localTotal - currentBackendTotal;
      
      console.log(`🔄 Sync comparison: Local=${localTotal}, Backend=${currentBackendTotal}, Diff=${pointsToAdd}`);
      
      // Chỉ sync nếu có chênh lệch đáng kể (>= 1 point)
      if (Math.abs(pointsToAdd) >= 1) {
        console.log(`🔄 Syncing ${pointsToAdd > 0 ? '+' : ''}${pointsToAdd} points to backend`);
        const result = await backendAPI.addPoints(pointsToAdd);
        console.log(`✅ Backend sync result: ${result.total_points}`);
      } else {
        console.log('✅ No significant difference, skipping backend update');
      }
      
      // Update last sync time
      localStorage.setItem('last_sync_time', Date.now().toString());
      
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
        
        // Also trigger storage event for cross-tab sync
        const storageEvent = new StorageEvent('storage', {
          key: 'tg-mini-app-storage',
          newValue: JSON.stringify(parsedData),
          storageArea: localStorage
        });
        window.dispatchEvent(storageEvent);
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