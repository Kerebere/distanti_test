import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ example: 'Иван', description: 'Имя пользователя' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Иванов', description: 'Фамилия пользователя' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Телефон пользователя',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9]\d{9,14}$/, {
    message:
      'Номер телефона должен быть в международном формате и содержать от 10 до 15 цифр.',
  })
  phone: string;
}
