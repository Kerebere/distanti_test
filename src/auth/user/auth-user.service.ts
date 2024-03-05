import {
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
import { AuthCredentialsDto } from '../dto/auth-credentials.dto';
import { CreateUserDto } from 'src/domains/users/dto/create-user.dto';
import { IAuthTokens } from '../interfaces/auth-tokens.interface';
import { VerificationEventService } from 'src/domains/verification-event/verification-event.service';

/**
 * AuthUserService class handles authentication and authorization logic for user.
 *
 * This class provides methods for validating user credentials, generating tokens,
 * refreshing tokens, registering users, logging out, resetting user password
 * and user activation.
 *
 * @remarks
 * This class is decorated with `@Injectable()` to indicate that it can be injected
 * as a dependency.
 */
@Injectable()
export class AuthUserService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly database: DatabaseService,
    private readonly verificationEventService: VerificationEventService,
  ) {}

  /**
   * Validates the user credentials.
   * It checks if a user with passed email exists and compares the hashed password
   *
   * @param {string} email - The email of the user.
   * @param {string} password - The password of the user.
   *
   * @return {Omit<User, 'password'> | null} Returns the user information if there is a user with the passed email and password, otherwise returns null.
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findOneByEmail(email);

    const isPasswordValid = await compare(password, user.password);

    if (isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  /**
   * Asynchronously logs in a user with the given credentials.
   *
   * @param {AuthCredentialsDto} credentials - The authentication credentials of the user (email and password).
   * @returns {Promise<IAuthTokens>} A promise that resolves to an object containing the generated tokens for the user.
   * @throws {UnauthorizedException} If the provided credentials are invalid.
   */
  async login(credentials: AuthCredentialsDto): Promise<IAuthTokens> {
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
   * Refreshes the access and refresh tokens for the given old refresh token.
   * It generates new refresh and access tokens and removes the old refresh token from the database.
   *
   * @param {string} oldRefreshToken - The old refresh token to be refreshed.
   * @returns {Promise<IAuthTokens>} - A promise that resolves to an object containing the new access token and refresh token.
   * @throws {UnauthorizedException} - If the old refresh token is invalid or expired.
   * @throws {UnauthorizedException} - If the user associated with the old refresh token is not found.
   */
  async refreshToken(oldRefreshToken: string): Promise<IAuthTokens> {
    const oldRefreshTokenRecord =
      await this.database.userRefreshToken.findUnique({
        where: { token: oldRefreshToken },
      });

    if (!oldRefreshTokenRecord || oldRefreshTokenRecord.expires < new Date()) {
      throw new UnauthorizedException('Неверный или истекший refresh токен');
    }

    const user = await this.usersService.getUserById(
      oldRefreshTokenRecord.userId,
    );

    await this.database.userRefreshToken.delete({
      where: { id: oldRefreshTokenRecord.id },
    });

    return await this.generateTokens(user);
  }

  /**
   * Generates access and refresh tokens for a user.
   * Save the refresh token to the database.
   *
   * @param {Omit<User, 'password'>} user - The user object without the password field.
   * @return {Promise<IAuthTokens>} - The generated access and refresh tokens.
   */
  async generateTokens(user: Omit<User, 'password'>): Promise<IAuthTokens> {
    const accessTokenPayload = { email: user.email, sub: user.id };
    const refreshTokenPayload = {
      username: user.email,
      sub: user.id,
      tokenType: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: process.env.USER_JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: process.env.USER_JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);

    await this.database.userRefreshToken.create({
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
   * Creates a user in the database and sends a letter to activate the user
   *
   * @param {CreateUserDto} createUserDto - The user data for creating a new user.
   * @return {Promise<IAuthTokens>} - A promise that resolves to an object containing access_token and refresh_token.
   */
  async registerUser(createUserDto: CreateUserDto): Promise<IAuthTokens> {
    const user = await this.usersService.createUser(createUserDto);
    await this.verificationEventService.requestUserActivation(user.email);
    return this.generateTokens(user);
  }

  /**
   * Logout method finds all tokens that were created by the owner of the passed token
   * and deletes them, including the passed token
   *
   * @param {string} refreshToken - Token through which other tokens will be found
   * @return {Promise<void>} - A promise that resolves when the deletion is complete
   */
  async logout(refreshToken: string): Promise<void> {
    const token = await this.database.userRefreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!token || !token.userId) {
      throw new UnauthorizedException('Токен не найден');
    }

    await this.database.userRefreshToken.deleteMany({
      where: { userId: token.userId },
    });
  }

  /**
   * Send password reset email to user, create password reset event data in database
   *
   * @param {string} email - Email of the user who wants to change the password
   * @returns {Promise<void>} - A promise that resolves when the email is sent
   * @throws {UnauthorizedException} - If the user is not found
   * @throws {UnauthorizedException} - If the user is not active
   * @throws {UnauthorizedException} - If the user is blocked
   */
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

    await this.verificationEventService.requestUserPasswordReset(email);
  }

  /**
   * Reset user password
   * Find password reset data by token and change password to {newPassword}
   *
   * @param {string} token - A token that defines a password reset event
   * @param {string} newPassword - Users new password
   * @returns {Promise<void>} - A promise that resolves when password is changed
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.verificationEventService.verifyUserPasswordReset(
      token,
      newPassword,
    );
  }

  /**
   * Activate user
   * Find user activation data by token and make user active
   *
   * @param {string} token - A token that defines a password reset event
   * @returns {Promise<void>} - A promise that resolves when user is active
   */
  async activateUser(token: string): Promise<void> {
    await this.verificationEventService.activateUser(token);
  }
}
