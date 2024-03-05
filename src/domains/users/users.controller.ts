import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetCurrentUserId } from './decorators/get-current-user-id.decorator';
import { UserOrEmployeeAuth } from '../../auth/decorators/auth.auth';

@ApiTags('Users')
@Controller('users')
@UserOrEmployeeAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // TODO: ролевой доступ
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно создан' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Пользователь с таким email или номером телефона уже существует',
    type: FieldConflictException,
  })
  @ApiResponse({ status: 400, description: 'Неверный запрос' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiResponse({ status: 200, description: 'Пользователь найден' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUserId() currentUserId: string,
  ) {
    return await this.usersService.getUserByIdAndVerify(currentUserId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Получение списка всех пользователей' })
  @ApiResponse({
    status: 200,
    description: 'Список всех пользователей получен',
  })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь обновлен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetCurrentUserId() currentUserId: string,
  ) {
    return await this.usersService.updateUser(currentUserId, id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Пользователь удален',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Пользователь не найден',
  })
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUserId() currentUserId: string,
  ): Promise<void> {
    await this.usersService.deleteUser(currentUserId, id);
  }
}
