import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'Группа 1', description: 'Название группы' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'url.com', description: 'Ссылка на иконку группы' })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;
}
