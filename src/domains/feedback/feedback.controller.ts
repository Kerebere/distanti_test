import { Body, Controller, Post, HttpStatus, HttpCode } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';

@ApiTags('Обратная связь')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создание заявки на обратную связь' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Заявка на обратную связь успешно создана.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Этот номер телефона уже существует в базе данных.',
    type: FieldConflictException,
  })
  async create(
    @Body() createFeedbackDto: CreateFeedbackDto,
  ): Promise<{ message: string }> {
    await this.feedbackService.create(createFeedbackDto);
    return { message: 'Заявка на обратную связь успешно создана.' };
  }
}
