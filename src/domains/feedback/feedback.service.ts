import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';

@Injectable()
export class FeedbackService {
  constructor(private database: DatabaseService) {}

  async create(createFeedbackDto: CreateFeedbackDto) {
    const existingPhone = await this.database.feedback.findUnique({
      where: { phone: createFeedbackDto.phone },
    });

    if (existingPhone) {
      throw new FieldConflictException(
        'phone',
        'Этот номер телефона уже существует в базе данных',
      );
    }
    return this.database.feedback.create({
      data: createFeedbackDto,
    });
  }
}
