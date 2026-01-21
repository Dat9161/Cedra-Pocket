'use client';

import { useState, useEffect } from 'react';
import { backendAPI } from '../../services/backend-api.service';
import { useUser } from '../../store/useAppStore';

export default function PetDebugPage() {
  const user = useUser();
  const [petStatus, setPetStatus] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPetData = async () => {
    if (!user?.telegramId) {
      setError('No user telegram ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Loading pet data for user:', user.telegramId);
      
      // Try to get pet status directly
      const petData = await backendAPI.getGamePetStatus();
      setPetStatus(petData);
      console.log('🐾 Pet status:', petData);

      // Try to get full dashboard
      const dashboardData = await backendAPI.getGameDashboard();
      setDashboard(dashboardData);
      console.log('📊 Dashboard:', dashboardData);

    } catch (err: any) {
      console.error('❌ Error loading pet data:', err);
      setError(err.message || 'Failed to load pet data');
    } finally {
      setLoading(false);
    }
  };

  const createPetData = async () => {
    if (!user?.telegramId) {
      setError('No user telegram ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔨 Creating pet data for user:', user.telegramId);
      
      // Try to feed pet (this should create pet data if it doesn't exist)
      const feedResult = await backendAPI.feedGamePet(1);
      console.log('🍖 Feed result:', feedResult);

      // Reload data
      await loadPetData();

    } catch (err: any) {
      console.error('❌ Error creating pet data:', err);
      setError(err.message || 'Failed to create pet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.telegramId) {
      loadPetData();
    }
  }, [user?.telegramId]);

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Pet Debug Page</h1>
        
        {/* User Info */}
        <div className="bg-white p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">User Info</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">Controls</h2>
          <div className="flex gap-2">
            <button
              onClick={loadPetData}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Reload Pet Data'}
            </button>
            <button
              onClick={createPetData}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Pet Data'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Pet Status */}
        <div className="bg-white p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">Pet Status</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {petStatus ? JSON.stringify(petStatus, null, 2) : 'No pet status data'}
          </pre>
        </div>

        {/* Dashboard */}
        <div className="bg-white p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">Dashboard</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {dashboard ? JSON.stringify(dashboard, null, 2) : 'No dashboard data'}
          </pre>
        </div>
      </div>
    </div>
  );
}