import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({
    example: 'Иван Иванов',
    description: 'Имя и фамилия пользователя',
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Телефон пользователя',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  phone: string;
}
