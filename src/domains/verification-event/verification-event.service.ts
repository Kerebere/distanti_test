import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VerificationEventRepository } from './verification-event.repository';
import { UsersService } from '../users/users.service';
import { MailService } from '../../common/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { VerificationEvent } from '@prisma/client';

@Injectable()
export class VerificationEventService {
  constructor(
    private readonly verificationEventRepository: VerificationEventRepository,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException('Пользователь с таким email не найден.');
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const verificationEvent =
      await this.verificationEventRepository.createPasswordResetEvent(
        email,
        expiresAt,
      );

    const baseUrl = this.configService.get<string>('BASE_URL');
    const resetPasswordUrl = `${baseUrl}/reset-password/${verificationEvent.accessKey}`;

    await this.mailService.sendEmail({
      to: [email],
      subject: 'Сброс пароля',
      body: `Для сброса пароля, пожалуйста, перейдите по ссылке: ${resetPasswordUrl}`,
    });
  }

  async verifyPasswordReset(
    accessKey: string,
    newPassword: string,
  ): Promise<void> {
    const event = await this.verificationEventRepository.findOneEvent({
      accessKey,
      eventType: 'passwordReset',
      status: 'pending',
    });

    if (!event || event.expiresAt < new Date()) {
      throw new NotFoundException(
        'Запрос на сброс пароля не найден или истек срок его действия.',
      );
    }

    if (event.passwordResetEvent) {
      await this.usersService.resetPassword(
        event.passwordResetEvent.email,
        newPassword,
      );

      await this.verificationEventRepository.updateEventStatus(
        event.id,
        'completed',
      );
    } else {
      throw new NotFoundException('Детали запроса на сброс пароля не найдены.');
    }
  }
}
