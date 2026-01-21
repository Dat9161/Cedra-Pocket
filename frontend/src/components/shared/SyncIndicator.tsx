/**
 * Sync Indicator Component
 * Shows sync status in a small indicator
 */

'use client';

import { useAutoSync } from '../../hooks/useAutoSync';

export function SyncIndicator() {
  const { syncStatus, formatTimeSinceSync } = useAutoSync();

  if (!syncStatus.isInitialized) {
    return null; // Don't show anything if not initialized
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
          backdrop-blur-sm border transition-all duration-300
          ${syncStatus.isSyncing 
            ? 'bg-blue-500/20 border-blue-500/30 text-blue-600' 
            : 'bg-green-500/20 border-green-500/30 text-green-600'
          }
        `}
        title={`Last sync: ${formatTimeSinceSync()}`}
      >
        {/* Sync status dot */}
        <div 
          className={`
            w-2 h-2 rounded-full transition-all duration-300
            ${syncStatus.isSyncing 
              ? 'bg-blue-500 animate-pulse' 
              : 'bg-green-500'
            }
          `}
        />
        
        {/* Status text */}
        <span>
          {syncStatus.isSyncing ? 'Syncing...' : 'Synced'}
        </span>
      </div>
    </div>
  );
}