import { Module } from '@nestjs/common';
import { QuestController } from './quest.controller';
import { QuestService } from './quest.service';
import { DailyQuestService } from './daily-quest.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestController],
  providers: [QuestService, DailyQuestService],
  exports: [QuestService, DailyQuestService],
})
export class QuestModule {}