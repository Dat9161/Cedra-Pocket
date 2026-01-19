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
      
      // Convert backend user to frontend format
      const userData = backendAPI.backendUserToUserData(response.user, {
        username: telegramUser?.username || telegramUser?.firstName,
        photoUrl: telegramUser?.photoUrl,
      });

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
