import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private database: DatabaseService) {}

  async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.database.user.findUnique({ where });
  }

  async findAllUsers(): Promise<Omit<User, 'password' | 'isBlocked'>[]> {
    return this.database.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        password: false,
        isBlocked: false,
      },
    });
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

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.database.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.database.user.delete({
      where: { id },
    });
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

  async updateIsActiveStatus(id: string, isActive: boolean) {
    await this.database.user.update({
      where: { id },
      data: { isActive },
    });
  }
}
