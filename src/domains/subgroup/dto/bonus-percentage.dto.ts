import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class BonusPercentageDto {
  @ApiProperty({ example: 1, description: 'Количество участников' })
  @IsNumber()
  @Min(1)
  count: number;

  @ApiProperty({
    example: 5,
    description: 'Процент бонуса для указанного количества участников',
  })
  @IsNumber()
  @Min(0)
  bonusPercentage: number;
}
