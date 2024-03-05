import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class GroupRepository {
  constructor(private readonly database: DatabaseService) {}

  async findAll() {
    return this.database.group.findMany();
  }

  async findUnique(where: Prisma.GroupWhereUniqueInput) {
    return this.database.group.findUnique({ where });
  }

  async create(group: Prisma.GroupCreateInput) {
    return this.database.group.create({ data: group });
  }

  async update(id: string, group: Prisma.GroupUpdateInput) {
    return this.database.group.update({ where: { id }, data: group });
  }

  async delete(id: string) {
    return this.database.group.delete({ where: { id } });
  }
}
