import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';

@Injectable()
export class FeedbackService {
  constructor(private prisma: DatabaseService) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    const existingPhone = await this.prisma.feedback.findUnique({
      where: { phone: createFeedbackDto.phone },
    });

    if (existingPhone) {
      throw new FieldConflictException(
        'phone',
        'Этот номер телефона уже существует в базе данных',
      );
    }
    return this.prisma.feedback.create({
      data: createFeedbackDto,
    });
  }
}
