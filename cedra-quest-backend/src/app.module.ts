import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { GameModule } from './game/game.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { QuestModule } from './quest/quest.module';
import { BlockchainController } from './blockchain/blockchain.controller';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    WalletModule,
    GameModule,
    BlockchainModule,
    QuestModule,
  ],
  controllers: [HealthController, BlockchainController],
})
export class AppModule {}