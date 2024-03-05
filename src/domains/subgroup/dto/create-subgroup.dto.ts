import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PriceDto } from './price.dto';
import { BonusPercentageDto } from './bonus-percentage.dto';

export class CreateSubgroupDto {
  @ApiProperty({ example: 'Подгруппа 1', description: 'Название подгруппы' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description:
      'Идентификатор группы первого уровня, к которой привязана подгруппа',
  })
  @IsNotEmpty()
  @IsString()
  parentId: string;

  @ApiProperty({
    example: 'SEO заголовок',
    description: 'SEO заголовок подгруппы',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Описание подгруппы' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    type: [PriceDto],
    description: 'Массив цен для различного количества участников',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceDto)
  prices: PriceDto[];

  @ApiProperty({
    type: [BonusPercentageDto],
    description:
      'Массив процентов бонуса в зависимости от количества участников',
  })
  @IsArray()
  @ValidateNested()
  @Type(() => BonusPercentageDto)
  bonusPercentages: BonusPercentageDto[];

  @ApiProperty({
    description:
      'Флаг, указывающий на необходимость выгрузки данных в ФИС ФРДО',
  })
  @IsBoolean()
  exportToFISFRDO: boolean;

  @ApiProperty({
    description: 'Флаг, указывающий на необходимость выгрузки данных в ЕГИСТ',
  })
  @IsBoolean()
  exportToEGIST: boolean;
}
