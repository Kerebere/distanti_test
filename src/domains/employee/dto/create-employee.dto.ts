import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Иванов', description: 'Фамилия сотрудника' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Иван', description: 'Имя сотрудника' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

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
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  // @ApiProperty() - TODO: Hardcode
  @IsString()
  role: string = 'Admin';

  @ApiProperty({ example: 'Password123!', description: 'Пароль сотрудника' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
