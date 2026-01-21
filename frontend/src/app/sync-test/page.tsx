'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { autoSyncService } from '../../services/auto-sync.service';
import { backendAPI } from '../../services/backend-api.service';

export default function SyncTestPage() {
  const { user, updateBalance } = useAppStore();
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);
  const [testAmount, setTestAmount] = useState(100);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    const checkStatus = async () => {
      const status = autoSyncService.getSyncStatus();
      setSyncStatus(status);
      
      const available = await backendAPI.isBackendAvailable();
      setBackendStatus(available);
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPoints = async () => {
    addLog(`Adding ${testAmount} points locally`);
    await updateBalance(testAmount, 'token');
    addLog(`Local balance updated to ${user?.tokenBalance || 0}`);
  };

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
    addLog('Checking backend user profile...');
    try {
      const profile = await backendAPI.getUserProfile();
      addLog(`Backend total: ${profile.total_points}`);
    } catch (error) {
      addLog(`Backend check failed: ${error}`);
    }
  };

  const handleResetLocal = () => {
    addLog('Resetting local storage...');
    localStorage.removeItem('tg-mini-app-storage');
    localStorage.removeItem('last_sync_time');
    window.location.reload();
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Sync Test Page</h1>
      
      {/* Status */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Status</h2>
        <div className="text-sm space-y-1">
          <div>Local Balance: <span className="font-mono">{user?.tokenBalance || 0}</span></div>
          <div>Backend Available: <span className={backendStatus ? 'text-green-600' : 'text-red-600'}>{backendStatus ? 'Yes' : 'No'}</span></div>
          <div>Sync Initialized: <span className={syncStatus?.isInitialized ? 'text-green-600' : 'text-red-600'}>{syncStatus?.isInitialized ? 'Yes' : 'No'}</span></div>
          <div>Currently Syncing: <span className={syncStatus?.isSyncing ? 'text-yellow-600' : 'text-gray-600'}>{syncStatus?.isSyncing ? 'Yes' : 'No'}</span></div>
          <div>Last Sync: <span className="font-mono">{syncStatus?.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleTimeString() : 'Never'}</span></div>
          <div>Device ID: <span className="font-mono text-xs">{syncStatus?.deviceId}</span></div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(Number(e.target.value))}
            className="flex-1 px-2 py-1 border rounded"
            placeholder="Points to add"
          />
          <button
            onClick={handleAddPoints}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Points
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleForceSync}
            className="flex-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Force Sync
          </button>
          <button
            onClick={handleCheckBackend}
            className="flex-1 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Check Backend
          </button>
        </div>
        
        <button
          onClick={handleResetLocal}
          className="w-full px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Reset Local Data
        </button>
      </div>

      {/* Logs */}
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Logs</h2>
        <div className="bg-black text-green-400 p-2 rounded text-xs font-mono h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600">
        <h3 className="font-semibold mb-1">How to test sync:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Add some points on this device</li>
          <li>Open the app on another device (PC/phone)</li>
          <li>Check if points appear on the other device</li>
          <li>Add points on the other device</li>
          <li>Come back here and check if they sync</li>
        </ol>
      </div>
    </div>
  );
}