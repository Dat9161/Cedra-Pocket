import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/**
 * Hook to listen for sync events and update the store
 */
export function useSyncEventListener() {
  const { setUser } = useAppStore();

  useEffect(() => {
    const handleSyncDataUpdated = (event: CustomEvent) => {
      console.log('🔄 Sync data updated event received:', event.detail);
      if (event.detail?.user) {
        setUser(event.detail.user);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'tg-mini-app-storage' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed.state?.user) {
            console.log('🔄 Cross-tab sync detected, updating user data');
            setUser(parsed.state.user);
          }
        } catch (error) {
          console.warn('Failed to parse storage event data:', error);
        }
      }
    };

    // Listen for custom sync events
    window.addEventListener('syncDataUpdated', handleSyncDataUpdated as EventListener);
    
    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('syncDataUpdated', handleSyncDataUpdated as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setUser]);
}