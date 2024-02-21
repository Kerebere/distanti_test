import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UsersRepository {
  constructor(private database: DatabaseService) {}
  async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.database.user.findUnique({ where });
  }

  async createUser(user: CreateUserDto): Promise<User> {
    const hashedPassword = await hash(user.password, 10);

    const newUser = await this.database.user.create({
      data: {
        ...user,
        password: hashedPassword,
      },
    });

    return newUser;
  }

  async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await hash(newPassword, 10);
    await this.database.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
  }
}
