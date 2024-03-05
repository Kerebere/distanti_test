import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGroupDto {
  @ApiProperty({ example: 'Группа 1', description: 'Название группы' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ format: 'binary', description: 'Файл иконки' })
  @IsOptional()
  @IsString()
  icon?: string;
}
