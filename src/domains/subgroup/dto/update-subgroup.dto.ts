import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSubgroupDto {
  @ApiProperty({ example: 'Подгруппа 1', description: 'Название подгруппы' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name?: string;

  @ApiProperty({
    description:
      'Идентификатор группы первого уровня, к которой привязана подгруппа',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  parentId?: string;

  @ApiProperty({
    example: 'SEO заголовок',
    description: 'SEO заголовок подгруппы',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Описание подгруппы' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'Флаг, указывающий на необходимость выгрузки данных в ФИС ФРДО',
  })
  @IsOptional()
  @IsBoolean()
  exportToFISFRDO?: boolean;

  @ApiProperty({
    description: 'Флаг, указывающий на необходимость выгрузки данных в ЕГИСТ',
  })
  @IsOptional()
  @IsBoolean()
  exportToEGIST?: boolean;
}
