'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { telegramService } from '../../services/telegram.service';
import { backendAPI } from '../../services/backend-api.service';
import { useAppStore } from '../../store/useAppStore';
import type { TelegramUser } from '../../models';

/**
 * Telegram context value interface
 */
interface TelegramContextValue {
  isInitialized: boolean;
  isAvailable: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  user: TelegramUser | null;
  triggerHapticFeedback: (type: 'light' | 'medium' | 'heavy') => void;
  closeApp: () => void;
  shareReferralLink: (link: string) => void;
  retryAuth: () => Promise<void>;
}

/**
 * Telegram context
 */
const TelegramContext = createContext<TelegramContextValue | null>(null);

/**
 * TelegramProvider props
 */
interface TelegramProviderProps {
  children: ReactNode;
}

/**
 * Get Telegram initData from WebApp
 */
function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') return null;
  
  const webApp = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
  if (!webApp?.initData) return null;
  
  return webApp.initData;
}

/**
 * TelegramProvider component
 * Requirements: 8.1, 8.3, 8.4
 * - 8.1: Retrieve user data from Telegram SDK on initialization
 * - 8.3: Handle navigation using Telegram's back button API
 * - 8.4: Use Telegram SDK's close method when requested
 */
export function TelegramProvider({ children }: TelegramProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const { setUser, setActiveTab } = useAppStore();

  /**
   * Authenticate with backend
   */
  const authenticateWithBackend = useCallback(async (initData: string, tgUser: TelegramUser | null) => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const response = await backendAPI.authenticate(initData);
      console.log('🔐 Backend auth response:', response);
      console.log('🔐 Backend user:', response.user);
      
      // Convert backend user to frontend format
      const userData = backendAPI.backendUserToUserData(response.user, {
        username: tgUser?.username,
        firstName: tgUser?.firstName,
        photoUrl: tgUser?.photoUrl,
      });
      console.log('👤 Converted user data:', userData);

      setUser(userData);
      setIsAuthenticated(true);
      console.log('✅ Backend authentication successful');
    } catch (error) {
      console.error('❌ Backend authentication failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
      
      // Fallback: create local user if backend fails
      if (tgUser) {
        console.log('⚠️ Using fallback local user');
        const fallbackUser = {
          id: `user_${tgUser.id}`,
          telegramId: String(tgUser.id),
          username: tgUser.username || tgUser.firstName,
          avatarUrl: tgUser.photoUrl,
          level: 1,
          currentXP: 0,
          requiredXP: 1000,
          tokenBalance: 0,
          gemBalance: 0,
          earningRate: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setUser(fallbackUser);
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [setUser]);

  /**
   * Retry authentication
   */
  const retryAuth = useCallback(async () => {
    const initData = getTelegramInitData();
    if (initData && telegramUser) {
      await authenticateWithBackend(initData, telegramUser);
    }
  }, [authenticateWithBackend, telegramUser]);

  // Initialize Telegram SDK and authenticate
  useEffect(() => {
    const initialize = async () => {
      try {
        await telegramService.initialize();
        
        // Get user data from Telegram SDK
        const user = telegramService.getUserData();
        console.log('📱 Telegram user data:', user);
        console.log('📱 Telegram WebApp available:', telegramService.isAvailable());
        setTelegramUser(user);
        
        // Clear old cached user if we have new Telegram user
        if (user) {
          console.log('🔄 Clearing old cached user data');
          localStorage.removeItem('tg-mini-app-storage');
        }

        // Get initData for backend authentication
        const initData = getTelegramInitData();

        if (initData && user) {
          // Authenticate with backend
          await authenticateWithBackend(initData, user);
        } else if (user) {
          // No initData but have user - create local user
          console.log('⚠️ No initData available, using local user');
          const appUser = {
            id: `user_${user.id}`,
            telegramId: String(user.id),
            username: user.username || user.firstName,
            avatarUrl: user.photoUrl,
            level: 1,
            currentXP: 0,
            requiredXP: 1000,
            tokenBalance: 0,
            gemBalance: 0,
            earningRate: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setUser(appUser);
        }
      } catch (error) {
        console.error('Failed to initialize Telegram SDK:', error);
        setAuthError('Failed to initialize');
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [setUser, authenticateWithBackend]);

  // Set up back button handler
  // Requirements: 8.3 - Handle navigation using Telegram's back button API
  useEffect(() => {
    if (!isInitialized) return;

    const handleBackButton = () => {
      // Get current tab from store
      const currentTab = useAppStore.getState().activeTab;
      // If not on home tab, navigate to home
      if (currentTab !== 'home') {
        setActiveTab('home');
        window.history.replaceState(null, '', '#home');
      } else {
        // If on home, close the app
        telegramService.closeApp();
      }
    };

    telegramService.handleBackButton(handleBackButton);

    return () => {
      telegramService.hideBackButton();
    };
  }, [isInitialized, setActiveTab]);

  // Memoized context value
  const contextValue: TelegramContextValue = {
    isInitialized,
    isAvailable: telegramService.isAvailable(),
    isAuthenticated,
    isAuthenticating,
    authError,
    user: telegramUser,
    triggerHapticFeedback: useCallback((type: 'light' | 'medium' | 'heavy') => {
      telegramService.triggerHapticFeedback(type);
    }, []),
    closeApp: useCallback(() => {
      telegramService.closeApp();
    }, []),
    shareReferralLink: useCallback((link: string) => {
      telegramService.shareReferralLink(link);
    }, []),
    retryAuth,
  };

  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
}

/**
 * Hook to access Telegram context
 */
export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
}

export default TelegramProvider;
