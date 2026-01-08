import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { validateTelegramWebAppData } from '../common/utils/telegram.utils';
import { VerifyAuthDto } from './dto/verify-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async verifyTelegramAuth(verifyAuthDto: VerifyAuthDto) {
    const { initData } = verifyAuthDto;
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      throw new UnauthorizedException('Bot token not configured');
    }

    // Validate initData với Bot Token
    const validatedData = validateTelegramWebAppData(initData, botToken);
    
    if (!validatedData || !validatedData.user) {
      throw new UnauthorizedException('Invalid Telegram data');
    }

    const telegramUser = validatedData.user;
    
    // Tìm hoặc tạo user trong DB
    let user = await this.usersService.findByTelegramId(
      telegramUser.id.toString(),
    );
    
    if (!user) {
      user = await this.usersService.create({
        telegram_id: telegramUser.id.toString(),
        username: telegramUser.username,
      });
    }

    // Tạo JWT token - convert BigInt to string for serialization
    const payload = {
      sub: user.id.toString(),
      telegramId: user.telegram_id,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id.toString(),
        telegram_id: user.telegram_id,
        username: user.username,
        wallet_address: user.wallet_address,
        total_points: Number(user.total_points),
        current_rank: user.current_rank,
        referral_code: user.referral_code,
      },
    };
  }
}