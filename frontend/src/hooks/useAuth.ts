/**
 * Authentication Hook
 * Handles Telegram authentication with backend
 */

import { useState, useCallback, useEffect } from 'react';
import { backendAPI, BackendAPIError } from '../services/backend-api.service';
import { useAppStore } from '../store/useAppStore';
import type { TelegramUser } from '../models';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  authenticate: (initData: string, telegramUser?: TelegramUser) => Promise<boolean>;
  logout: () => void;
}

/**
 * Telegram WebApp type for initData access
 */
interface TelegramWebAppWithInitData {
  initData?: string;
}

/**
 * Get Telegram initData from WebApp
 */
function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') return null;
  
  const webApp = (window as unknown as { Telegram?: { WebApp?: TelegramWebAppWithInitData } }).Telegram?.WebApp;
  if (!webApp?.initData) return null;
  
  return webApp.initData;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { setUser, user } = useAppStore();

  const isAuthenticated = !!user;

  /**
   * Authenticate with backend using Telegram initData
   */
  const authenticate = useCallback(async (initData: string, telegramUser?: TelegramUser): Promise<boolean> => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const response = await backendAPI.authenticate(initData);
      
      // Create user data from backend response
      const userData = {
        id: String(response.user.id),
        telegramId: response.user.telegram_id,
        username: telegramUser?.username || telegramUser?.firstName || response.user.username || 'Player',
        avatarUrl: telegramUser?.photoUrl,
        level: Math.floor(Number(response.user.total_points) / 1000) + 1,
        currentXP: Number(response.user.total_points) % 1000,
        requiredXP: 1000,
        tokenBalance: Number(response.user.total_points),
        walletBalance: 0,
        gemBalance: 0,
        earningRate: 10,
        walletAddress: response.user.wallet_address || undefined,
        createdAt: new Date(response.user.created_at),
        updatedAt: new Date(response.user.updated_at),
        totalPoints: Number(response.user.total_points),
        lifetimePoints: Number(response.user.total_points),
      };

      setUser(userData);
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      
      if (error instanceof BackendAPIError) {
        setAuthError(error.message);
      } else {
        setAuthError('Authentication failed. Please try again.');
      }
      
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [setUser]);

  /**
   * Logout - clear token and user
   */
  const logout = useCallback(() => {
    backendAPI.clearToken();
    setUser(null);
    setAuthError(null);
  }, [setUser]);

  /**
   * Auto-authenticate on mount if initData available
   */
  useEffect(() => {
    const autoAuth = async () => {
      // Skip if already have user data
      if (user) return;

      const initData = getTelegramInitData();
      if (initData) {
        await authenticate(initData);
      }
    };

    autoAuth();
  }, [authenticate]);

  return {
    isAuthenticated,
    isAuthenticating,
    authError,
    authenticate,
    logout,
  };
}
