import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { DatabaseService } from '../../core/database';

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService, DatabaseService],
})
export class FeedbackModule {}
