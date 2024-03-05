import { Injectable, NotFoundException } from '@nestjs/common';
import { SubgroupRepository } from './subgroup.repository';
import { CreateSubgroupDto } from './dto/create-subgroup.dto';
import { UpdateSubgroupDto } from './dto/update-subgroup.dto';

@Injectable()
export class SubgroupService {
  constructor(private readonly subgroupRepository: SubgroupRepository) {}

  async create(createSubgroupDto: CreateSubgroupDto) {
    const { parentId, ...subgroupData } = createSubgroupDto;

    return this.subgroupRepository.create({
      ...subgroupData,
      parent: { connect: { id: parentId } },
      prices: { createMany: { data: createSubgroupDto.prices } },
      bonusPercentages: {
        createMany: { data: createSubgroupDto.bonusPercentages },
      },
    });
  }

  async getAll() {
    return this.subgroupRepository.findAll();
  }

  async getOne(id: string) {
    const subgroup = await this.subgroupRepository.findUnique({ id });
    if (!subgroup) {
      throw new NotFoundException('Подгруппа не найдена');
    }

    return subgroup;
  }

  async update(id: string, updateSubgroupDto: UpdateSubgroupDto) {
    const subgroup = await this.subgroupRepository.findUnique({ id });

    if (!subgroup) {
      throw new NotFoundException('Подгруппа не найдена');
    }

    const { parentId, ...subgroupData } = updateSubgroupDto;
    const parent = parentId ? { connect: { id: parentId } } : {};

    return this.subgroupRepository.update(id, {
      ...subgroupData,
      parent,
    });
  }

  async delete(id: string) {
    const subgroup = await this.subgroupRepository.findUnique({ id });

    if (!subgroup) {
      throw new NotFoundException('Подгруппа не найдена');
    }

    return this.subgroupRepository.delete(id);
  }
}
