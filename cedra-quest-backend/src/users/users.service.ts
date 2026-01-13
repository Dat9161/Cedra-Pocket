import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { user_rank } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Generate unique referral code
    const referralCode = this.generateReferralCode();
    
    // Handle referrer if provided
    let referrerId: bigint | null = null;
    if (createUserDto.referrer_id) {
      const referrer = await this.findByReferralCode(createUserDto.referrer_id);
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    return this.prisma.users.create({
      data: {
        telegram_id: createUserDto.telegram_id,
        username: createUserDto.username,
        wallet_address: createUserDto.wallet_address,
        is_wallet_connected: createUserDto.is_wallet_connected || false,
        referral_code: referralCode,
        referrer_id: referrerId,
        total_points: 0,
        current_rank: 'BRONZE',
      },
    });
  }

  async findAll() {
    return this.prisma.users.findMany({
      select: {
        id: true,
        telegram_id: true,
        username: true,
        total_points: true,
        current_rank: true,
        created_at: true,
      },
      orderBy: {
        total_points: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(id) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByTelegramId(telegramId: string) {
    return this.prisma.users.findUnique({
      where: { telegram_id: telegramId },
    });
  }

  async findByReferralCode(referralCode: string) {
    return this.prisma.users.findUnique({
      where: { referral_code: referralCode },
    });
  }

  async connectWallet(userId: string, connectWalletDto: ConnectWalletDto) {
    // Check if wallet is already connected to another user
    const existingUser = await this.prisma.users.findUnique({
      where: { wallet_address: connectWalletDto.wallet_address },
    });

    if (existingUser && existingUser.id !== BigInt(userId)) {
      throw new ConflictException('Wallet already connected to another user');
    }

    return this.prisma.users.update({
      where: { id: BigInt(userId) },
      data: {
        wallet_address: connectWalletDto.wallet_address,
        is_wallet_connected: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: any = { ...updateUserDto };
    if (data.current_rank) {
      data.current_rank = data.current_rank as user_rank;
    }
    
    return this.prisma.users.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  async addPoints(userId: bigint, points: number) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        total_points: {
          increment: points,
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.users.delete({
      where: { id: BigInt(id) },
    });
  }

  private generateReferralCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }
}
