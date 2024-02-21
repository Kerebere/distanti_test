import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/domains/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { User } from '@prisma/client';
import { DatabaseService } from 'src/core/database';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { CreateUserDto } from 'src/domains/users/dto/create-user.dto';
import { AuthRepository } from './auth.repository';
import { VerificationEventService } from '../domains/verification-event/verification-event.service';

/**
 * AuthService class handles authentication and authorization logic.
 *
 * This class provides methods for validating user credentials, generating tokens,
 * refreshing tokens, registering users, and logging out.
 *
 * @remarks
 * This class is decorated with `@Injectable()` to indicate that it can be injected
 * as a dependency.
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private database: DatabaseService,
    private authRepository: AuthRepository,
    private readonly verificationEventService: VerificationEventService,
  ) {}

  /**
   * Validates the user credentials.
   *
   * @param {string} email - The email of the user.
   * @param {string} password - The password of the user.
   *
   * @return {Omit<User, 'password'> | null} Returns the user information if the user is valid, otherwise returns null.
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findOneByEmail(email);

    if (user) {
      const isPasswordValid = await compare(password, user.password);

      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }

    return null;
  }

  /**
   * Asynchronously logs in a user with the given credentials.
   *
   * @param {AuthCredentialsDto} credentials - The authentication credentials of the user.
   * @returns {Promise<{ access_token: string; refresh_token: string }>} A promise that resolves to an object containing the generated tokens for the user.
   * @throws {UnauthorizedException} If the provided credentials are invalid.
   */
  async login(
    credentials: AuthCredentialsDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.validateUser(
      credentials.email,
      credentials.password,
    );

    if (!user) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    return this.generateTokens(user);
  }

  /**
   * Refreshes the access token and refresh token for the given old refresh token.
   *
   * @param {string} oldRefreshToken - The old refresh token to be refreshed.
   * @returns {Promise<{ access_token: string; refresh_token: string }>} - A promise that resolves to an object containing the new access token and refresh token.
   * @throws {UnauthorizedException} - If the old refresh token is invalid or expired.
   * @throws {UnauthorizedException} - If the user associated with the old refresh token is not found.
   */
  async refreshToken(
    oldRefreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const oldRefreshTokenRecord = await this.database.refreshToken.findUnique({
      where: { token: oldRefreshToken },
    });

    if (!oldRefreshTokenRecord || oldRefreshTokenRecord.expires < new Date()) {
      throw new UnauthorizedException('Неверный или истекший refresh токен');
    }

    const user = await this.usersService.findOneById(
      oldRefreshTokenRecord.userId,
    );

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    await this.database.refreshToken.delete({
      where: { id: oldRefreshTokenRecord.id },
    });

    return await this.generateTokens(user);
  }

  /**
   * Generates access and refresh tokens for a user.
   *
   * @param {Omit<User, 'password'>} user - The user object without the password field.
   *
   * @return {Promise<{ access_token: string; refresh_token: string }>} - The generated access and refresh tokens.
   */
  async generateTokens(
    user: Omit<User, 'password'>,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const accessTokenPayload = { email: user.email, sub: user.id };
    const refreshTokenPayload = {
      username: user.email,
      sub: user.id,
      tokenType: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);

    await this.database.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expires: expiration,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Registers a new user.
   *
   * @param {CreateUserDto} createUserDto - The user data for creating a new user.
   * @return {Promise<{ access_token: string; refresh_token: string }>} - A promise that resolves to an object containing access_token and refresh_token.
   */
  async registerUser(
    createUserDto: CreateUserDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersService.registerUser(createUserDto);
    return this.generateTokens(user);
  }

  /**
   * Logout method deletes all the refresh tokens associated with the userID
   * @param {string} userId - The user ID for which the refresh tokens need to be deleted
   * @return {Promise<void>} - A promise that resolves when the deletion is complete
   */
  async logout(userId: string) {
    await this.database.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async resetPasswordRequest(email: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Пользователь не активирован');
    }

    if (user.isBlocked) {
      throw new ForbiddenException('Пользователь заблокирован');
    }

    await this.verificationEventService.requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.verificationEventService.verifyPasswordReset(token, newPassword);
  }
}
