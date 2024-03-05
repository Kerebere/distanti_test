import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VerificationEventService } from './verification-event.service';
import { VerificationEventRepository } from './verification-event.repository';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../../common/mail/mail.module';
import { EmployeeModule } from '../employee/employee.module';

@Module({
  imports: [ConfigModule, UsersModule, EmployeeModule, MailModule],
  providers: [VerificationEventService, VerificationEventRepository],
  exports: [VerificationEventService],
})
export class VerificationEventModule {}
