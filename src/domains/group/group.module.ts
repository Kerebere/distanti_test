import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupRepository } from './group.repository';
import { GroupService } from './group.service';
import { S3Module } from '../../common/s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [GroupController],
  providers: [GroupRepository, GroupService],
})
export class GroupModule {}
