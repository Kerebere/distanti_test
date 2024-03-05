import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';
import { compare, hash } from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findOneByEmail(email: string) {
    const user = await this.usersRepository.findOne({ email });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async findOneByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ phone });
  }

  async getAllUsers(): Promise<Omit<User, 'password' | 'isBlocked'>[]> {
    return this.usersRepository.findAllUsers();
  }

  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ id });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const { password, ...result } = user;
    return result;
  }

  async getUserByIdAndVerify(
    currentUserId: string,
    id: string,
  ): Promise<Omit<User, 'password'>> {
    if (currentUserId !== id) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return this.getUserById(id);
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
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

  async updateUser(
    currentUserId: string,
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    if (currentUserId !== id) {
      throw new ForbiddenException('Недостаточно прав');
    }

    const existingUser = await this.usersRepository.findOne({ id });

    if (!existingUser) {
      throw new NotFoundException('Пользователь не найден.');
    }

    // Проверка уникальности email
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const userByEmail = await this.usersRepository.findOne({
        email: updateUserDto.email,
      });
      if (userByEmail && userByEmail.id !== id) {
        throw new FieldConflictException(
          'email',
          'Пользователь с таким email уже существует.',
        );
      }
    }

    // Проверка уникальности телефона
    if (updateUserDto.phone && updateUserDto.phone !== existingUser.phone) {
      const userByPhone = await this.usersRepository.findOne({
        phone: updateUserDto.phone,
      });
      if (userByPhone && userByPhone.id !== id) {
        throw new FieldConflictException(
          'phone',
          'Пользователь с таким телефоном уже существует.',
        );
      }
    }

    return this.usersRepository.updateUser(id, updateUserDto);
  }

  async deleteUser(currentUserId: string, id: string): Promise<void> {
    if (currentUserId !== id) {
      throw new ForbiddenException('Недостаточно прав');
    }

    const user = await this.usersRepository.findOne({ id });

    if (!user) {
      throw new NotFoundException('Пользователь не найден.');
    }

    await this.usersRepository.deleteUser(id);
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

  async activateUser(email: string) {
    const user = await this.usersRepository.findOne({ email });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.usersRepository.updateIsActiveStatus(user.id, true);
  }
}
