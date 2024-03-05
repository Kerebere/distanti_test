import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubgroupRepository {
  constructor(private readonly database: DatabaseService) {}

  async findAll() {
    return this.database.subgroup.findMany({
      include: {
        prices: true,
        bonusPercentages: true,
      },
    });
  }

  async findUnique(where: Prisma.SubgroupWhereUniqueInput) {
    return this.database.subgroup.findUnique({
      where,
      include: {
        prices: true,
        bonusPercentages: true,
      },
    });
  }

  async create(subgroup: Prisma.SubgroupCreateInput) {
    return this.database.subgroup.create({
      data: subgroup,
      include: {
        prices: true,
        bonusPercentages: true,
      },
    });
  }

  async update(id: string, subgroup: Prisma.SubgroupUpdateInput) {
    return this.database.subgroup.update({
      where: { id },
      data: subgroup,
      include: {
        prices: true,
        bonusPercentages: true,
      },
    });
  }

  async delete(id: string) {
    return this.database.subgroup.delete({ where: { id } });
  }
}
