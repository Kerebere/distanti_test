import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';
import { compare, hash } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ email });
  }

  async findOneByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ phone });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ id });
  }

  async registerUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUserByEmail = await this.findOneByEmail(createUserDto.email);

    if (existingUserByEmail) {
      throw new FieldConflictException(
        'email',
        'Пользователь с таким email уже существует',
      );
    }

    const existingUserByPhone = await this.findOneByPhone(createUserDto.phone);

    if (existingUserByPhone) {
      throw new FieldConflictException(
        'phone',
        'Пользователь с таким номером телефона уже существует',
      );
    }

    return this.usersRepository.createUser(createUserDto);
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepository.findOne({ email });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const isMatch = await compare(currentPassword, user.password);

    if (!isMatch) {
      throw new BadRequestException('Текущий пароль неверный');
    }

    await this.usersRepository.updatePassword(user.id, newPassword);
  }

  async resetPassword(email: string, newPassword: string) {
    const user = await this.usersRepository.findOne({ email });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.usersRepository.updatePassword(user.id, newPassword);
  }
}
