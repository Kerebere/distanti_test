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
  ],

  providers: [FeedbackService],

  controllers: [FeedbackController],
})
export class AppModule {}
