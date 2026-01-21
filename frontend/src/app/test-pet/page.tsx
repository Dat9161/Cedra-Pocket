'use client';

import { useState } from 'react';

export default function TestPetPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('123456789'); // Test user ID

  const testPetStatus = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing pet status for user:', userId);
      const response = await fetch(`https://cedra-pocket-wybm.vercel.app/game/pet/status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('📊 Pet status response:', data);
      setResult({ type: 'Pet Status', data });
    } catch (error) {
      console.error('❌ Error:', error);
      setResult({ type: 'Error', data: error });
    } finally {
      setLoading(false);
    }
  };

  const testDashboard = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing dashboard for user:', userId);
      const response = await fetch(`https://cedra-pocket-wybm.vercel.app/game/dashboard/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('📊 Dashboard response:', data);
      setResult({ type: 'Dashboard', data });
    } catch (error) {
      console.error('❌ Error:', error);
      setResult({ type: 'Error', data: error });
    } finally {
      setLoading(false);
    }
  };

  const testFeedPet = async () => {
    setLoading(true);
    try {
      console.log('🍖 Testing feed pet for user:', userId);
      const response = await fetch(`https://cedra-pocket-wybm.vercel.app/game/pet/feed/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedCount: 1 }),
      });
      
      const data = await response.json();
      console.log('🍖 Feed pet response:', data);
      setResult({ type: 'Feed Pet', data });
    } catch (error) {
      console.error('❌ Error:', error);
      setResult({ type: 'Error', data: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Pet API</h1>
        
        {/* User ID Input */}
        <div className="bg-white p-4 rounded-lg mb-4">
          <label className="block text-sm font-medium mb-2">User ID (Telegram ID)</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter telegram user ID"
          />
        </div>

        {/* Test Buttons */}
        <div className="bg-white p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">Test Actions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={testPetStatus}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Pet Status'}
            </button>
            <button
              onClick={testDashboard}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Dashboard'}
            </button>
            <button
              onClick={testFeedPet}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Feed Pet'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Result: {result.type}</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-96">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}