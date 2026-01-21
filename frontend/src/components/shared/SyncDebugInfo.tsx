'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { autoSyncService } from '../../services/auto-sync.service';
import { backendAPI } from '../../services/backend-api.service';

interface SyncDebugInfoProps {
  show: boolean;
  onClose: () => void;
}

export function SyncDebugInfo({ show, onClose }: SyncDebugInfoProps) {
  const { user } = useAppStore();
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    if (!show) return;

    const updateStatus = async () => {
      const status = autoSyncService.getSyncStatus();
      setSyncStatus(status);
      
      const available = await backendAPI.isBackendAvailable();
      setBackendStatus(available);
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 3000);
    return () => clearInterval(interval);
  }, [show]);

  const handleForceSync = async () => {
    addLog('Forcing sync...');
    try {
      await autoSyncService.forceSyncNow();
      addLog('Force sync completed');
    } catch (error) {
      addLog(`Force sync failed: ${error}`);
    }
  };

  const handleCheckBackend = async () => {
    addLog('Checking backend...');
    try {
      const profile = await backendAPI.getUserProfile();
      addLog(`Backend total: ${profile.total_points}`);
    } catch (error) {
      addLog(`Backend check failed: ${error}`);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-h-96 bg-white border rounded-lg shadow-lg p-3 text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Sync Debug</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      
      {/* Status */}
      <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
        <div>Local: <span className="font-mono">{user?.tokenBalance || 0}</span></div>
        <div>Backend: <span className={backendStatus ? 'text-green-600' : 'text-red-600'}>{backendStatus ? 'Online' : 'Offline'}</span></div>
        <div>Syncing: <span className={syncStatus?.isSyncing ? 'text-yellow-600' : 'text-gray-600'}>{syncStatus?.isSyncing ? 'Yes' : 'No'}</span></div>
        <div>Last: <span className="font-mono">{syncStatus?.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleTimeString() : 'Never'}</span></div>
      </div>

      {/* Controls */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={handleForceSync}
          className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Sync
        </button>
        <button
          onClick={handleCheckBackend}
          className="flex-1 px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
        >
          Check
        </button>
      </div>

      {/* Logs */}
      <div className="bg-black text-green-400 p-1 rounded text-xs font-mono h-32 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="text-xs">{log}</div>
        ))}
      </div>
    </div>
  );
}