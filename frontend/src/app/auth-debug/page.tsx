'use client';

import { useState, useEffect } from 'react';
import { backendAPI } from '../../services/backend-api.service';
import { useTelegram } from '../../components/providers/TelegramProvider';

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user: telegramUser } = useTelegram();

  const runDebugTests = async () => {
    setIsLoading(true);
    const info: any = {};

    try {
      // 1. Check Telegram WebApp context
      info.telegramWebApp = {
        available: typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp,
        initData: typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initData : null,
        user: typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user : null,
      };

      // 2. Check backend availability
      info.backendAvailable = await backendAPI.isBackendAvailable();

      // 3. Test authentication
      if (info.telegramWebApp.initData) {
        try {
          const authResult = await backendAPI.authenticate(info.telegramWebApp.initData);
          info.authResult = authResult;
        } catch (error) {
          info.authError = error instanceof Error ? error.message : String(error);
        }
      } else {
        info.authError = 'No Telegram initData available';
      }

      // 4. Check current user profile
      try {
        const userProfile = await backendAPI.getUserProfile();
        info.userProfile = userProfile;
      } catch (error) {
        info.userProfileError = error instanceof Error ? error.message : String(error);
      }

      // 5. Test health check
      try {
        const health = await backendAPI.healthCheck();
        info.healthCheck = health;
      } catch (error) {
        info.healthError = error instanceof Error ? error.message : String(error);
      }

    } catch (error) {
      info.generalError = error instanceof Error ? error.message : String(error);
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  useEffect(() => {
    runDebugTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">🔍 Authentication Debug</h1>
          
          <button
            onClick={runDebugTests}
            disabled={isLoading}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Running Tests...' : 'Run Debug Tests'}
          </button>

          <div className="space-y-4">
            {/* Telegram Context */}
            <div className="border rounded p-4">
              <h2 className="font-bold text-lg mb-2">📱 Telegram Context</h2>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <div><strong>WebApp Available:</strong> {debugInfo.telegramWebApp?.available ? '✅ Yes' : '❌ No'}</div>
                <div><strong>InitData:</strong> {debugInfo.telegramWebApp?.initData ? '✅ Available' : '❌ Missing'}</div>
                <div><strong>User Data:</strong></div>
                <pre className="mt-2 text-xs overflow-auto">
                  {JSON.stringify(debugInfo.telegramWebApp?.user, null, 2)}
                </pre>
              </div>
            </div>

            {/* Backend Status */}
            <div className="border rounded p-4">
              <h2 className="font-bold text-lg mb-2">🖥️ Backend Status</h2>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <div><strong>Backend Available:</strong> {debugInfo.backendAvailable ? '✅ Yes' : '❌ No'}</div>
                {debugInfo.healthCheck && (
                  <div><strong>Health Check:</strong> ✅ {debugInfo.healthCheck.status}</div>
                )}
                {debugInfo.healthError && (
                  <div><strong>Health Error:</strong> ❌ {debugInfo.healthError}</div>
                )}
              </div>
            </div>

            {/* Authentication */}
            <div className="border rounded p-4">
              <h2 className="font-bold text-lg mb-2">🔐 Authentication</h2>
              <div className="bg-gray-100 p-3 rounded text-sm">
                {debugInfo.authResult && (
                  <div>
                    <div><strong>Auth Status:</strong> ✅ Success</div>
                    <div><strong>User Created:</strong></div>
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(debugInfo.authResult.user, null, 2)}
                    </pre>
                  </div>
                )}
                {debugInfo.authError && (
                  <div><strong>Auth Error:</strong> ❌ {debugInfo.authError}</div>
                )}
              </div>
            </div>

            {/* User Profile */}
            <div className="border rounded p-4">
              <h2 className="font-bold text-lg mb-2">👤 User Profile</h2>
              <div className="bg-gray-100 p-3 rounded text-sm">
                {debugInfo.userProfile && (
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(debugInfo.userProfile, null, 2)}
                  </pre>
                )}
                {debugInfo.userProfileError && (
                  <div><strong>Profile Error:</strong> ❌ {debugInfo.userProfileError}</div>
                )}
              </div>
            </div>

            {/* Current Telegram User */}
            <div className="border rounded p-4">
              <h2 className="font-bold text-lg mb-2">📋 Current Telegram User (from Provider)</h2>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(telegramUser, null, 2)}
                </pre>
              </div>
            </div>

            {/* Raw Debug Info */}
            <div className="border rounded p-4">
              <h2 className="font-bold text-lg mb-2">🔧 Raw Debug Info</h2>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <pre className="text-xs overflow-auto max-h-96">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}