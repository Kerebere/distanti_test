import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { Response } from 'express';
import { Cookies } from 'src/common/decorators';
import { CreateUserDto } from 'src/domains/users/dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ConfigService } from '@nestjs/config';
import { FieldConflictException } from '../common/exceptions/field-conflict.exception';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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
      path: '/auth/refresh',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 days or 7 days
    };

    response.cookie('refreshToken', refreshToken, cookieOptions);
  }

  @ApiOperation({ summary: 'Аутентификация пользователя' })
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
    description: 'Данные аутентификации пользователя',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Res({ passthrough: true }) response: Response,
    @Body() credentials: AuthCredentialsDto,
  ) {
    const { access_token, refresh_token } = await this.authService.login(
      credentials,
    );

    this.setRefreshTokenCookie(response, refresh_token, credentials.rememberMe);

    return { access_token };
  }

  @ApiOperation({ summary: 'Обновление токенов' })
  @ApiResponse({
    status: 200,
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
    status: 401,
    description: 'Неверный или истекший refresh токен',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Внутренняя ошибка сервера',
  })
  @Post('refresh')
  async refresh(
    @Cookies('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh токен отсутствует');
    }

    const { access_token, refresh_token } = await this.authService.refreshToken(
      refreshToken,
    );

    this.setRefreshTokenCookie(response, refresh_token, false);

    return { access_token };
  }

  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Пользователь успешно зарегистрирован',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Пользователь с таким email или номером телефона уже существует',
    type: FieldConflictException,
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(
    @Res({ passthrough: true }) response: Response,
    @Body() createUserDto: CreateUserDto,
  ) {
    const { access_token, refresh_token } = await this.authService.registerUser(
      createUserDto,
    );

    this.setRefreshTokenCookie(response, refresh_token, true);

    return { access_token };
  }

  @ApiOperation({ summary: 'Запрос на сброс пароля.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Инструкции по сбросу пароля отправлены на указанный email.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Пользователь не найден',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Пользователь не активирован',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Пользователь заблокирован',
  })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async resetPasswordRequest(@Body() { email }: ForgotPasswordDto) {
    await this.authService.resetPasswordRequest(email);

    return {
      message: 'Инструкции по сбросу пароля отправлены на указанный email.',
    };
  }

  @ApiOperation({ summary: 'Сбросить пароль пользователя.' })
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
    await this.authService.resetPassword(token, resetPasswordDto.password);
    return { message: 'Пароль успешно сброшен.' };
  }
}
