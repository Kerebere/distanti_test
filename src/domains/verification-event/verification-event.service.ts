import { Injectable, NotFoundException } from '@nestjs/common';
import { VerificationEventRepository } from './verification-event.repository';
import { UsersService } from 'src/domains/users/users.service';
import { EmployeeService } from 'src/domains/employee/employee.service';
import { MailService } from '../../common/mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VerificationEventService {
  constructor(
    private readonly verificationEventRepository: VerificationEventRepository,
    private readonly usersService: UsersService,
    private readonly employeeService: EmployeeService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async requestUserPasswordReset(email: string) {
    return this.requestPasswordReset(email);
  }

  async requestEmployeePasswordReset(email: string) {
    return this.requestPasswordReset(email);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const verificationEvent =
      await this.verificationEventRepository.createPasswordResetEvent(
        email,
        expiresAt,
      );

    const baseUrl = this.configService.get<string>('BASE_URL');
    const resetPasswordUrl = `${baseUrl}/?token=${verificationEvent.accessKey}`;

    await this.mailService.sendEmail({
      to: [email],
      subject: 'Сброс пароля',
      body: `Для сброса пароля, пожалуйста, перейдите по ссылке: ${resetPasswordUrl}`,
    });
  }

  async findPasswordResetEvent(accessKey: string) {
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

    if (!event.passwordResetEvent) {
      throw new NotFoundException('Детали запроса на сброс пароля не найдены.');
    }

    return event;
  }

  async verifyUserPasswordReset(accessKey: string, newPassword: string) {
    const event = await this.findPasswordResetEvent(accessKey);

    await this.usersService.resetPassword(
      event.passwordResetEvent!.email,
      newPassword,
    );

    await this.verificationEventRepository.updateEventStatus(
      event.id,
      'completed',
    );
  }

  async verifyEmployeePasswordReset(
    accessKey: string,
    newPassword: string,
  ): Promise<void> {
    const event = await this.findPasswordResetEvent(accessKey);

    await this.employeeService.resetPassword(
      event.passwordResetEvent!.email,
      newPassword,
    );

    await this.verificationEventRepository.updateEventStatus(
      event.id,
      'completed',
    );
  }

  async requestActivation(email: string, resetRoute: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // неделя
    const verificationEvent =
      await this.verificationEventRepository.createUserActivateEvent(
        email,
        expiresAt,
      );

    const baseUrl = this.configService.get<string>('BASE_URL');
    const resetPasswordUrl = `${baseUrl}/${resetRoute}/?token=${verificationEvent.accessKey}`;

    await this.mailService.sendEmail({
      to: [email],
      subject: 'Активация аккаунта',
      body: `Для активации вашего аккаунта перейдите по этой ссылке: ${resetPasswordUrl}`,
    });
  }

  async requestEmployeeActivation(email: string) {
    return this.requestActivation(email, 'activate-employee');
  }

  async requestUserActivation(email: string) {
    return this.requestActivation(email, 'activate-user');
  }

  async findActivateEvent(accessKey: string) {
    const event = await this.verificationEventRepository.findOneEvent({
      accessKey,
      eventType: 'userActivate',
      status: 'pending',
    });

    if (!event || event.expiresAt < new Date()) {
      throw new NotFoundException(
        'Запрос на активацию аккаунта не найден или истек срок его действия.',
      );
    }

    if (!event.userActivateEvent) {
      throw new NotFoundException(
        'Детали запроса на активацию аккаунта не найдены.',
      );
    }

    return event;
  }

  async activateUser(accessKey: string) {
    const event = await this.findActivateEvent(accessKey);

    await this.usersService.activateUser(event.userActivateEvent!.email);

    await this.verificationEventRepository.updateEventStatus(
      event.id,
      'completed',
    );
  }

  async activateEmployee(accessKey: string) {
    const event = await this.findActivateEvent(accessKey);

    await this.employeeService.activateEmployee(event.userActivateEvent!.email);

    await this.verificationEventRepository.updateEventStatus(
      event.id,
      'completed',
    );
  }
}
