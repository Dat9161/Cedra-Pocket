import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TelegramInitData, TelegramUser } from '../common/interfaces/auth.interface';

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);
  private readonly botToken: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (!this.botToken || this.botToken === 'YOUR_REAL_BOT_TOKEN_HERE') {
      if (isDevelopment) {
        this.logger.warn('⚠️  TELEGRAM_BOT_TOKEN not configured - using development mode');
        this.logger.warn('🚧 Telegram signature validation will be bypassed for testing');
        this.botToken = 'development_mode'; // Set a placeholder token
      } else {
        this.logger.error('❌ TELEGRAM_BOT_TOKEN not configured properly in production');
        this.logger.error('📋 Please follow HOW_TO_GET_REAL_INITDATA.md to set up real Telegram authentication');
        throw new Error('TELEGRAM_BOT_TOKEN is required in production. Please check .env file and HOW_TO_GET_REAL_INITDATA.md');
      }
    }
  }

  /**
   * Validates Telegram initData and extracts user information
   * @param initData Raw initData string from Telegram
   * @returns Validated TelegramUser object
   */
  async validateTelegramInitData(initData: string): Promise<TelegramUser> {
    try {
      this.logger.debug('Validating Telegram initData...');
      
      // Parse the initData
      const parsed = this.parseInitData(initData);
      this.logger.debug(`Parsed user ID: ${parsed.telegram_id}, username: ${parsed.username}`);
      
      // Development bypass for testing (only when NODE_ENV is not production)
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (isDevelopment) {
        this.logger.warn('🚧 Development mode: Bypassing Telegram signature validation');
        this.logger.warn('⚠️  In production, real Telegram signature validation will be enforced');
        const user = {
          id: parsed.telegram_id,
          username: parsed.username,
          first_name: parsed.first_name,
          last_name: parsed.last_name,
        };
        this.logger.log(`Development user validated: ${user.id} (${user.username || user.first_name})`);
        return user;
      }
      
      // Validate the signature
      if (!this.validateSignature(initData, parsed.hash)) {
        this.logger.warn('Telegram signature validation failed');
        throw new UnauthorizedException('Invalid Telegram signature');
      }
      this.logger.debug('Telegram signature validated successfully');

      // Check if the data is not too old (5 minutes)
      const authDate = new Date(parsed.auth_date * 1000);
      const now = new Date();
      const timeDiff = now.getTime() - authDate.getTime();
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (timeDiff > maxAge) {
        this.logger.warn(`Telegram auth data is too old: ${timeDiff}ms > ${maxAge}ms`);
        throw new UnauthorizedException('Telegram auth data is too old');
      }
      this.logger.debug(`Telegram auth data age: ${timeDiff}ms (valid)`);

      const user = {
        id: parsed.telegram_id,
        username: parsed.username,
        first_name: parsed.first_name,
        last_name: parsed.last_name,
      };
      
      this.logger.log(`Successfully validated Telegram user: ${user.id} (${user.username || user.first_name})`);
      return user;
    } catch (error) {
      this.logger.error('Failed to validate Telegram initData', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Telegram authentication data');
    }
  }

  /**
   * Parses the initData string into structured data
   * @param initData Raw initData string
   * @returns Parsed TelegramInitData object
   */
  private parseInitData(initData: string): TelegramInitData {
    // Development mode: handle simple test data
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment && (!initData || initData === 'test' || initData.length < 10)) {
      this.logger.warn('🚧 Development mode: Using mock user data for testing');
      return {
        telegram_id: '123456789',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'mock_hash',
        query_id: 'mock_query_id',
      };
    }
    
    try {
      const params = new URLSearchParams(initData);
      
      // Extract user data
      const userStr = params.get('user');
      if (!userStr) {
        if (isDevelopment) {
          this.logger.warn('🚧 Development mode: No user data found, using mock data');
          return {
            telegram_id: '123456789',
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mock_hash',
            query_id: 'mock_query_id',
          };
        }
        throw new Error('User data not found in initData');
      }

      let userData;
      try {
        userData = JSON.parse(userStr);
      } catch (error) {
        if (isDevelopment) {
          this.logger.warn('🚧 Development mode: Invalid user data format, using mock data');
          return {
            telegram_id: '123456789',
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mock_hash',
            query_id: 'mock_query_id',
          };
        }
        throw new Error('Invalid user data format');
      }

      const authDate = params.get('auth_date');
      const hash = params.get('hash');

      if (!authDate || !hash) {
        if (isDevelopment) {
          this.logger.warn('🚧 Development mode: Missing auth parameters, using current time and mock hash');
          return {
            telegram_id: userData.id?.toString() || '123456789',
            username: userData.username || 'testuser',
            first_name: userData.first_name || 'Test',
            last_name: userData.last_name || 'User',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mock_hash',
            query_id: 'mock_query_id',
          };
        }
        throw new Error('Missing required auth parameters');
      }

      return {
        telegram_id: userData.id?.toString(),
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        auth_date: parseInt(authDate),
        hash: hash,
        query_id: params.get('query_id'),
      };
    } catch (error) {
      if (isDevelopment) {
        this.logger.warn('🚧 Development mode: Parse error, falling back to mock data');
        return {
          telegram_id: '123456789',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'mock_hash',
          query_id: 'mock_query_id',
        };
      }
      throw error;
    }
  }

  /**
   * Validates the Telegram signature using HMAC-SHA256
   * @param initData Raw initData string
   * @param hash Expected hash from Telegram
   * @returns True if signature is valid
   */
  private validateSignature(initData: string, hash: string): boolean {
    try {
      // Remove hash from the data
      const params = new URLSearchParams(initData);
      params.delete('hash');
      
      // Sort parameters alphabetically
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Create secret key
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.botToken)
        .digest();

      // Calculate expected hash
      const expectedHash = crypto
        .createHmac('sha256', secretKey)
        .update(sortedParams)
        .digest('hex');

      return expectedHash === hash;
    } catch (error) {
      this.logger.error('Error validating signature', error);
      return false;
    }
  }
}