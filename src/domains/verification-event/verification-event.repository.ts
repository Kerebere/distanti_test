import { Injectable } from '@nestjs/common';
import { VerificationEvent, Prisma, PasswordResetEvent } from '@prisma/client';
import { DatabaseService } from 'src/core/database';
import { v4 as uuid } from 'uuid';

@Injectable()
export class VerificationEventRepository {
  constructor(private database: DatabaseService) {}

  async createPasswordResetEvent(email: string, expiresAt: Date) {
    const accessKey = uuid();

    return this.database.verificationEvent.create({
      data: {
        accessKey,
        eventType: 'passwordReset',
        expiresAt,
        status: 'pending',
        passwordResetEvent: {
          create: { email },
        },
      },
    });
  }

  async findOneEvent(filter: Prisma.VerificationEventWhereInput) {
    return this.database.verificationEvent.findFirst({
      where: filter,
      include: { passwordResetEvent: true },
    });
  }

  async updateEventStatus(id: string, status: string) {
    return this.database.verificationEvent.update({
      where: { id },
      data: { status },
    });
  }
}
