/**
 * Sync Event Listener Hook
 * Listens for sync events and updates app state accordingly
 */

import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { UserData } from '../models';

export function useSyncEventListener() {
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    const handleSyncDataUpdated = (event: CustomEvent<{ user: UserData }>) => {
      console.log('🔄 Sync data updated, updating app state:', event.detail.user);
      setUser(event.detail.user);
    };

    // Listen for sync updates
    window.addEventListener('syncDataUpdated', handleSyncDataUpdated as EventListener);

    return () => {
      window.removeEventListener('syncDataUpdated', handleSyncDataUpdated as EventListener);
    };
  }, [setUser]);
}