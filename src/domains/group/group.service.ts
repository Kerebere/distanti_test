import { Injectable, NotFoundException } from '@nestjs/common';
import { GroupRepository } from './group.repository';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';
import { CreateGroupDto } from './dto/create-group-dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { S3Service } from 'src/common/s3/s3.service';

@Injectable()
export class GroupService {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly s3Service: S3Service,
  ) {}

  async create(createGroupDto: CreateGroupDto) {
    const group = await this.groupRepository.findUnique({
      name: createGroupDto.name,
    });

    if (group) {
      throw new FieldConflictException(
        'name',
        'Группа с таким name уже существует',
      );
    }

    return this.groupRepository.create(createGroupDto);
  }

  async getAll() {
    return this.groupRepository.findAll();
  }

  async update(
    id: string,
    updateGroupDto: UpdateGroupDto,
    icon?: Express.Multer.File,
  ) {
    const group = await this.groupRepository.findUnique({ id });

    if (!group) {
      throw new NotFoundException('Группа не найдена');
    }

    let iconUrl = group.iconUrl;
    if (icon) {
      const { url } = await this.s3Service.uploadFile(icon);
      iconUrl = url;
    }

    return this.groupRepository.update(id, {
      name: updateGroupDto.name,
      iconUrl,
    });
  }

  async delete(id: string) {
    const group = await this.groupRepository.findUnique({ id });

    if (!group) {
      throw new NotFoundException('Группа не найдена');
    }

    return this.groupRepository.delete(id);
  }
}
