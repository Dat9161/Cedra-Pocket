'use client';

import { useState, useEffect } from 'react';
import { QuestScreen } from '../../components/quest/QuestScreen';
import { useAppStore } from '../../store/useAppStore';
import { backendAPI } from '../../services/backend-api.service';

/**
 * Quest Test Page
 * Test the quest navigation functionality
 */
export default function QuestTestPage() {
  const { setQuests, setUser } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTestData = async () => {
      try {
        // Set up a test user
        const testUser = {
          id: 'test_user',
          telegramId: '123456789',
          username: 'Test User',
          level: 1,
          currentXP: 0,
          requiredXP: 1000,
          tokenBalance: 0,
          walletBalance: 0,
          gemBalance: 0,
          earningRate: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setUser(testUser);

        // Load quests (will use mock data if backend not available)
        const backendQuests = await backendAPI.getQuests();
        const frontendQuests = backendQuests.map((q) => backendAPI.backendQuestToQuest(q));
        setQuests(frontendQuests);

        console.log('✅ Test data initialized');
        console.log('Quests loaded:', frontendQuests);
      } catch (error) {
        console.error('Failed to initialize test data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTestData();
  }, [setQuests, setUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quest test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <h1 className="text-xl font-bold text-gray-800">Quest Navigation Test</h1>
        <p className="text-sm text-gray-600 mt-1">
          Test the "Go" button functionality for social media quests
        </p>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 m-4">
        <h2 className="font-semibold text-yellow-800">Test Instructions:</h2>
        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
          <li>1. Click the "Go" button on social media quests (Twitter, Telegram)</li>
          <li>2. The external link should open in a new tab/window</li>
          <li>3. The quest should automatically become "Claimable" after clicking Go</li>
          <li>4. Click "Claim" to complete the quest and earn rewards</li>
        </ul>
      </div>

      {/* Quest Screen */}
      <div className="h-[calc(100vh-200px)]">
        <QuestScreen />
      </div>
    </div>
  );
}