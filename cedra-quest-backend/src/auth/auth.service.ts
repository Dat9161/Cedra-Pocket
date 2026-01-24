import { Injectable, Logger } from '@nestjs/common';
import { TelegramAuthService } from './telegram-auth.service';
import { UserService } from '../user/user.service';
import { WalletNameService } from '../wallet/wallet-name.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthenticationResult, UserStatus } from '../common/interfaces/auth.interface';
import { WalletCreationDto, WalletRecoveryDto } from '../common/dto/auth.dto';
import { WalletCreationResult } from '../common/interfaces/wallet.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private telegramAuthService: TelegramAuthService,
    private userService: UserService,
    private walletNameService: WalletNameService,
    private walletService: WalletService,
  ) {}

  /**
   * Authenticate user with Telegram initData and auto-create if needed
   * @param initData Telegram initData string
   * @returns Authentication result with user info
   */
  async verifyAndCreateUser(initData: string): Promise<AuthenticationResult> {
    try {
      this.logger.log('🔍 Starting user verification and creation process');
      
      // Step 1: Validate Telegram initData
      this.logger.log('📱 Validating Telegram initData...');
      const telegramUser = await this.telegramAuthService.validateTelegramInitData(initData);
      this.logger.log(`✅ Telegram user validated: ID=${telegramUser.id}, username=${telegramUser.username || telegramUser.first_name}`);
      
      // Step 2: Check if user exists
      this.logger.log(`🔍 Checking if user exists in database: ${telegramUser.id}`);
      let existingUser = await this.userService.findUserByTelegramId(telegramUser.id);
      
      if (existingUser) {
        // Case A: Existing user - return user info
        this.logger.log(`✅ Existing user found: ${telegramUser.id}`);
        return {
          success: true,
          user: existingUser,
        };
      } else {
        // Case B: New user - auto create with full info
        this.logger.log(`🆕 New user detected, creating account: ${telegramUser.id}`);
        
        try {
          // Create user with full Telegram info
          const newUser = await this.userService.createUser({
            telegram_id: String(telegramUser.id),
            username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            total_points: 0,
            current_rank: 'RANK1',
          });
          
          this.logger.log(`✅ New user created successfully: ${newUser.telegram_id}`);
          return {
            success: true,
            user: newUser,
          };
        } catch (createError) {
          this.logger.error('❌ Failed to auto-create user', createError);
          return {
            success: false,
            error: 'Failed to create user account',
          };
        }
      }
    } catch (error) {
      this.logger.error('❌ Authentication failed', error);
      return {
        success: false,
        error: error.message || 'Authentication failed',
      };
    }
  }

  /**
   * Authenticate user with Telegram initData
   * @param initData Telegram initData string
   * @returns Authentication result with user info or suggested wallet name
   */
  async authenticateUser(initData: string): Promise<AuthenticationResult> {
    try {
      // Step 1: Validate Telegram initData
      const telegramUser = await this.telegramAuthService.validateTelegramInitData(initData);
      
      // Step 2: Check if user exists
      const existingUser = await this.userService.findUserByTelegramId(telegramUser.id);
      
      if (existingUser) {
        // Case A: Existing user - return user info for immediate login
        this.logger.log(`Existing user login: ${telegramUser.id}`);
        return {
          success: true,
          user: existingUser,
        };
      } else {
        // Case B: New user - generate suggested wallet name
        this.logger.log(`New user registration: ${telegramUser.id}`);
        const suggestedWalletName = await this.walletNameService.generateSuggestedWalletName(telegramUser);
        
        return {
          success: true,
          suggestedWalletName,
        };
      }
    } catch (error) {
      this.logger.error('Authentication failed', error);
      return {
        success: false,
        error: error.message || 'Authentication failed',
      };
    }
  }

  /**
   * Create wallet for new user
   * @param walletData Wallet creation data
   * @returns Wallet creation result
   */
  async createWallet(walletData: WalletCreationDto): Promise<WalletCreationResult> {
    try {
      // Validate wallet name format
      if (!this.walletNameService.validateWalletNameFormat(walletData.requested_address)) {
        return {
          success: false,
          error: 'Invalid wallet name format',
        };
      }

      // Double check if wallet name is still available
      const isTaken = await this.walletNameService.isWalletNameTaken(walletData.requested_address);
      if (isTaken) {
        return {
          success: false,
          error: 'Wallet name is no longer available',
        };
      }

      // TODO: Create wallet on blockchain using master wallet
      // const blockchainResult = await this.blockchainService.createWalletAccount(
      //   walletData.requested_address,
      //   walletData.public_key
      // );

      // For now, simulate successful blockchain creation
      const blockchainResult = {
        success: true,
        transaction_hash: `0x${Date.now().toString(16)}`, // Mock transaction hash
      };

      if (!blockchainResult.success) {
        return {
          success: false,
          error: 'Failed to create wallet on blockchain',
        };
      }

      // Save to database
      const dbResult = await this.walletService.createUserWallet({
        telegram_id: walletData.telegram_id,
        requested_address: walletData.requested_address,
        public_key: walletData.public_key,
      });

      if (!dbResult.success) {
        return dbResult;
      }

      this.logger.log(`Wallet created successfully for user: ${walletData.telegram_id}`);
      
      return {
        success: true,
        wallet_address: walletData.requested_address,
        transaction_hash: blockchainResult.transaction_hash,
      };
    } catch (error) {
      this.logger.error('Wallet creation failed', error);
      return {
        success: false,
        error: 'Wallet creation failed',
      };
    }
  }

  /**
   * Recover wallet using public key
   * @param recoveryData Wallet recovery data
   * @returns User info if wallet found
   */
  async recoverWallet(recoveryData: WalletRecoveryDto): Promise<AuthenticationResult> {
    try {
      const user = await this.userService.findUserByPublicKey(recoveryData.public_key);
      
      if (!user) {
        return {
          success: false,
          error: 'No wallet found for this public key',
        };
      }

      this.logger.log(`Wallet recovered for user: ${user.telegram_id}`);
      
      return {
        success: true,
        user,
      };
    } catch (error) {
      this.logger.error('Wallet recovery failed', error);
      return {
        success: false,
        error: 'Wallet recovery failed',
      };
    }
  }
}