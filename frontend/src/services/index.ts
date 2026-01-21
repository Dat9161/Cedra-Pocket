/**
 * Services Index
 * Central export for all service layer implementations
 */

// Storage Service
export {
  StorageService,
  storageService,
  StorageQuotaExceededError,
  StorageParseError,
  type IStorageService,
} from './storage.service';

// Telegram Service
export {
  TelegramService,
  telegramService,
  type ITelegramService,
  type HapticFeedbackType,
} from './telegram.service';

// Wallet Service
export {
  WalletService,
  walletService,
  WalletConnectionError,
  type IWalletService,
  type ConnectionChangeCallback,
} from './wallet.service';

// Backend API Service (Real)
export {
  BackendAPIService,
  backendAPI,
  BackendAPIError,
  type AuthResponse,
  type BackendUser,
  type BackendQuest,
} from './backend-api.service';

// Offline Queue Service
export {
  offlineQueueService,
  type QueuedAction,
  type QueuedActionType,
  type SyncResult,
} from './offline-queue.service';

// Auto Sync Service
export {
  AutoSyncService,
  autoSyncService,
  type SyncData,
} from './auto-sync.service';
