import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class PriceDto {
  @ApiProperty({ example: 1, description: 'Количество участников' })
  @IsNumber()
  @Min(1)
  count: number;

  @ApiProperty({
    example: 100,
    description: 'Цена для указанного количества участников',
  })
  @IsNumber()
  @Min(0)
  price: number;
}
