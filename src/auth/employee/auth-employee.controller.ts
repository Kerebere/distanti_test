import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Get,
  Post,
  Res,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CreateEmployeeDto } from 'src/domains/employee/dto/create-employee.dto';
import { AuthCredentialsDto } from '../dto/auth-credentials.dto';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';
import { Cookies } from '../../common/decorators';
import { AuthEmployeeService } from './auth-employee.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@ApiTags('Аутентификация сотрудника')
@Controller('auth/employee')
export class AuthEmployeeController {
  constructor(
    private readonly authEmployeeService: AuthEmployeeService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
    rememberMe: boolean,
  ) {
    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      path: '/auth/employee/refresh',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 days or 7 days
    };

    response.cookie('employeeRefreshToken', refreshToken, cookieOptions);
  }

  @ApiOperation({ summary: 'Аутентификация сотрудника' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Успешная аутентификация',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Успешная аутентификация',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Неверные учетные данные',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Внутренняя ошибка сервера',
  })
  @ApiBody({
    type: AuthCredentialsDto,
    description: 'Данные аутентификации сотрудника',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Res({ passthrough: true }) response: Response,
    @Body() credentials: AuthCredentialsDto,
  ) {
    const { access_token, refresh_token } =
      await this.authEmployeeService.login(credentials);

    this.setRefreshTokenCookie(response, refresh_token, credentials.rememberMe);

    return { access_token };
  }

  @ApiOperation({ summary: 'Обновление токенов для сотрудника' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Access токен успешно обновлен',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Неверный или истекший refresh токен',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Внутренняя ошибка сервера',
  })
  @Post('refresh')
  async refresh(
    @Cookies('employeeRefreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh токен отсутствует');
    }

    const { access_token, refresh_token } =
      await this.authEmployeeService.refreshToken(refreshToken);

    this.setRefreshTokenCookie(response, refresh_token, false);

    return { access_token };
  }

  @ApiOperation({ summary: 'Регистрация нового сотрудника' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Сотрудник успешно зарегистрирован',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Сотрудник с таким email уже существует',
    type: FieldConflictException,
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(
    @Res({ passthrough: true }) response: Response,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    const { access_token, refresh_token } =
      await this.authEmployeeService.register(createEmployeeDto);

    this.setRefreshTokenCookie(response, refresh_token, true);

    return { access_token };
  }

  @Get('/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Выход сотрудника из системы' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Сотрудник вышел из системы',
  })
  async logout(
    @Cookies('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('employeeRefreshToken');
    await this.authEmployeeService.logout(refreshToken);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Запрос на сброс пароля.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Инструкции по сбросу пароля отправлены на указанный email.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Сотрудник не найден',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Сотрудник не активирован',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Сотрудник заблокирован',
  })
  @HttpCode(HttpStatus.OK)
  async resetPasswordRequest(@Body() { email }: ForgotPasswordDto) {
    await this.authEmployeeService.resetPasswordRequest(email);

    return {
      message: 'Инструкции по сбросу пароля отправлены на указанный email.',
    };
  }

  @ApiOperation({ summary: 'Сбросить пароль сотрудника.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Пароль успешно сброшен.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Запрос на сброс пароля не найден или истек срок его действия.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password/:token')
  async resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    await this.authEmployeeService.resetPassword(
      token,
      resetPasswordDto.password,
    );
    return { message: 'Пароль успешно сброшен.' };
  }

  @Post('/activate-employee/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Активировать сотрудника' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Сотрудник активирован',
  })
  async activateEmployee(@Param('token') token: string) {
    await this.authEmployeeService.activateEmployee(token);
  }
}
