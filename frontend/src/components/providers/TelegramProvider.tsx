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
 * Get Telegram user from initDataUnsafe (backup method)
 */
function getTelegramUserFromInitData(): TelegramUser | null {
  if (typeof window === 'undefined') return null;
  
  const webApp = (window as unknown as { 
    Telegram?: { 
      WebApp?: { 
        initDataUnsafe?: { 
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            language_code?: string;
          }
        } 
      } 
    } 
  }).Telegram?.WebApp;
  
  const user = webApp?.initDataUnsafe?.user;
  if (!user) return null;
  
  console.log('📱 Raw initDataUnsafe.user:', user);
  
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    photoUrl: user.photo_url,
    languageCode: user.language_code,
  };
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
      console.log(`💰 Backend balance: ${userData.tokenBalance}`);
      console.log(`💰 Raw backend total_points: ${response.user.total_points}`);
      
      // Clear local storage to ensure backend is source of truth
      localStorage.removeItem('tg-mini-app-storage');
      
      // Always use backend balance as source of truth
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
          walletBalance: 0,
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
        // Debug: Log all Telegram WebApp data
        const webApp = (window as unknown as { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp;
        console.log('🔍 Full Telegram WebApp object:', webApp);
        console.log('🔍 window.Telegram:', (window as unknown as { Telegram?: unknown }).Telegram);
        
        await telegramService.initialize();
        
        // Get user data from Telegram SDK (try both methods)
        let user = telegramService.getUserData();
        console.log('📱 Telegram user from service:', user);
        
        // Fallback: try getting from initDataUnsafe directly
        if (!user) {
          user = getTelegramUserFromInitData();
          console.log('📱 Telegram user from initDataUnsafe:', user);
        }
        
        console.log('📱 Telegram WebApp available:', telegramService.isAvailable());
        console.log('📱 Final Telegram user:', user);
        setTelegramUser(user);
        
        // Always clear old cached user on fresh load to prevent stale data
        const cachedData = localStorage.getItem('tg-mini-app-storage');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // If cached username is "Guest Player" or different from Telegram user, clear it
          if (parsed?.state?.user?.username === 'Guest Player' || 
              (user && parsed?.state?.user?.username !== user.username && parsed?.state?.user?.username !== user.firstName)) {
            console.log('🔄 Clearing stale cached user data');
            localStorage.removeItem('tg-mini-app-storage');
          }
        }

        // Get initData for backend authentication
        const initData = getTelegramInitData();
        console.log('🔑 initData available:', !!initData);

        if (initData && user) {
          // Authenticate with backend
          await authenticateWithBackend(initData, user);
        } else if (user) {
          // No initData but have user - create local user
          console.log('⚠️ No initData available, using local user from Telegram');
          const appUser = {
            id: `user_${user.id}`,
            telegramId: String(user.id),
            username: user.username || user.firstName || 'Player',
            avatarUrl: user.photoUrl,
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
          setUser(appUser);
        } else {
          // No Telegram user available - create anonymous user with timestamp
          console.log('⚠️ No Telegram user available, creating anonymous user');
          const anonymousUser = {
            id: `anon_${Date.now()}`,
            telegramId: `anon_${Date.now()}`,
            username: 'Player',
            avatarUrl: undefined,
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
          setUser(anonymousUser);
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
