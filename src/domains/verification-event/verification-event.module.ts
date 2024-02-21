import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VerificationEventService } from './verification-event.service';
import { VerificationEventRepository } from './verification-event.repository';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
  imports: [ConfigModule, UsersModule, MailModule],
  providers: [VerificationEventService, VerificationEventRepository],
  exports: [VerificationEventService],
})
export class VerificationEventModule {}
