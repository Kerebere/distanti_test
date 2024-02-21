import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'password123456~!@#$%^&*()_+',
    description: 'Пароль пользователя',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
