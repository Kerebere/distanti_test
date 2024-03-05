import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './domains/users/users.module';
import { AuthModule } from './auth/auth.module';
import { S3Module } from './common/s3/s3.module';
import { MailModule } from './common/mail/mail.module';
import { validationSchema } from './core/environment';
import { FeedbackController } from './domains/feedback/feedback.controller';
import { FeedbackModule } from './domains/feedback/feedback.module';
import { FeedbackService } from './domains/feedback/feedback.service';
import { GroupModule } from './domains/group/group.module';
import { SubgroupModule } from './domains/subgroup/subgroup.module';
import { EmployeeModule } from './domains/employee/employee.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
    }),
    UsersModule,
    AuthModule,
    FeedbackModule,
    S3Module,
    MailModule,
    FeedbackModule,
    GroupModule,
    SubgroupModule,
    EmployeeModule,
  ],

  providers: [FeedbackService],

  controllers: [FeedbackController],
})
export class AppModule {}
