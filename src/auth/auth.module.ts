import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from 'src/domains/users/users.module';
import { EmployeeModule } from 'src/domains/employee/employee.module';

import { DatabaseModule } from 'src/core/database';
import { MailModule } from 'src/common/mail/mail.module';
import { VerificationEventModule } from '../domains/verification-event/verification-event.module';
import { EmployeeStrategy } from './strategies/employee.strategy';
import { UserStrategy } from './strategies/user.strategy';

import { AuthUserController } from './user/auth-user.controller';
import { AuthUserService } from './user/auth-user.service';
import { AuthEmployeeController } from './employee/auth-employee.controller';
import { AuthEmployeeService } from './employee/auth-employee.service';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    EmployeeModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
    MailModule,
    ConfigModule,
    VerificationEventModule,
  ],
  controllers: [AuthUserController, AuthEmployeeController],
  providers: [
    EmployeeStrategy,
    UserStrategy,
    AuthUserService,
    AuthEmployeeService,
  ],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
