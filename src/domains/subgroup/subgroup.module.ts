import { Module } from '@nestjs/common';
import { SubgroupController } from './subgroup.controller';
import { SubgroupRepository } from './subgroup.repository';
import { SubgroupService } from './subgroup.service';

@Module({
  controllers: [SubgroupController],
  providers: [SubgroupRepository, SubgroupService],
})
export class SubgroupModule {}
