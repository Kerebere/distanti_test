import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmployeeDto {
  @ApiProperty({
    example: 'Иванов',
    description: 'Фамилия сотрудника',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: 'Иван',
    description: 'Имя сотрудника',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'Иванович',
    description: 'Отчество сотрудника',
    required: false,
  })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({
    example: 'employee@example.com',
    description: 'Email сотрудника',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  // @ApiProperty() - TODO: Hardcode
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Пароль сотрудника',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;
}
