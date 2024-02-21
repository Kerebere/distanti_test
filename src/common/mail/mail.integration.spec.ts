import { Test, TestingModule } from '@nestjs/testing';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SendMailDto } from './dto/SendMailDto';

describe('MailService Integration Tests', () => {
  async function initializeService() {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MailerModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            transport: configService.get<string>('MAIL_TRANSPORT'),
            defaults: {
              from: configService.get<string>('MAIL_FROM_NAME'),
            },
          }),
          inject: [ConfigService],
        }),
        ConfigModule.forRoot(),
      ],
      providers: [MailService],
    }).compile();

    return module.get<MailService>(MailService);
  }

  it('should send a welcome email using SendMailDto with HTML content', async () => {
    const service = await initializeService();
    const mailData: SendMailDto = {
      to: ['isakovdr@gmail.com'],
      subject: 'Добро пожаловать в Академию ДПО',
      body: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Добро пожаловать в Академию ДПО</title>
</head>
<body>
  <p>
    Добрый день, благодарим за регистрацию в Академии
    дополнительного профессионального образования.
  </p>
  ...
  <p>С уважением,<br /> Академия ДПО</p>
</body>
</html>`,
      from: 'ackademiadpo@yandex.ru',
    };

    await expect(service.sendEmail(mailData)).resolves.not.toThrow();
  });
});
