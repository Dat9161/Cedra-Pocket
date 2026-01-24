import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RankingService } from '../game/services/ranking.service';

@Module({
  controllers: [UserController],
  providers: [UserService, RankingService],
  exports: [UserService],
})
export class UserModule {}