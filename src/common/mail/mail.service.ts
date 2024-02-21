import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailDto } from './dto/SendMailDto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(mailData: SendMailDto): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: mailData.to,
        subject: mailData.subject,
        html: mailData.body,
      });
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendActivationEmail(
    email: string,
    activationLink: string,
  ): Promise<void> {
    const mailData: SendMailDto = {
      to: [email],
      subject: 'Активация аккаунта',
      html: `Для активации аккаунта перейдите по ссылке: ${activationLink}`,
    };

    try {
      await this.mailerService.sendMail(mailData);
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`, error.stack);
    }
  }
}
