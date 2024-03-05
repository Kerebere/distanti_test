import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { hashSync } from 'bcrypt';
import { AuthUserService } from './auth-user.service';
import { UsersService } from 'src/domains/users/users.service';
import { DatabaseService } from 'src/core/database';
import { VerificationEventService } from 'src/domains/verification-event/verification-event.service';
import { AuthCredentialsDto } from '../dto/auth-credentials.dto';
import { IAuthTokens } from '../interfaces/auth-tokens.interface';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('AuthUserService', () => {
  let service: AuthUserService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let databaseService: DatabaseService;
  let verificationEventService: VerificationEventService;

  const userPassword = 'somepassword';
  const userWrongPassword = 'somewrongpassword';
  const userHashedPassword = hashSync(userPassword, 10);
  const userWithoutPassword = {
    firstName: 'John',
    middleName: '',
    lastName: 'Doe',
    email: 'user@mail.com',
    phone: '1234567890',
    avatarUrl: 'url.com',
    isBlocked: false,
    isActive: false,
  };
  const userRecordWithoutPassword = {
    ...userWithoutPassword,
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tokens = {
    access_token: {
      value: 'SomeAccessToken',
      secret: process.env.USER_JWT_ACCESS_SECRET,
      expiresIn: '15m',
    },
    refresh_token: {
      value: 'SomeRefreshToken',
      secret: process.env.USER_JWT_REFRESH_SECRET,
      expiresIn: '7d',
      duration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // now + 7 days
    },
  };

  // refresh token entity from database
  const refreshTokenRecord = {
    id: '1',
    token: tokens.refresh_token.value,
    expires: tokens.refresh_token.duration,
    userId: userRecordWithoutPassword.id,
  };

  const authCredentialsDto: AuthCredentialsDto = {
    email: userRecordWithoutPassword.email,
    password: userPassword,
    rememberMe: true,
  };
  const authTokens: IAuthTokens = {
    access_token: tokens.access_token.value,
    refresh_token: tokens.refresh_token.value,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthUserService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn(),
            getUserById: jest.fn(),
            createUser: jest.fn(),
          },
        },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        {
          provide: DatabaseService,
          useValue: {
            userRefreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: VerificationEventService,
          useValue: {
            requestUserActivation: jest.fn(),
            requestUserPasswordReset: jest.fn(),
            verifyUserPasswordReset: jest.fn(),
            activateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthUserService>(AuthUserService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    verificationEventService = module.get<VerificationEventService>(
      VerificationEventService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue({
        ...userRecordWithoutPassword,
        password: userHashedPassword,
      });

      const result = await service.validateUser(
        userRecordWithoutPassword.email,
        userPassword,
      );

      expect(result).toEqual(userRecordWithoutPassword);
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        userRecordWithoutPassword.email,
      );
    });

    it('should return null if user is not found', async () => {
      const notFoundError = new NotFoundException('Пользователь не найден');

      jest
        .spyOn(usersService, 'findOneByEmail')
        .mockRejectedValue(notFoundError);

      await expect(
        service.validateUser(userRecordWithoutPassword.email, userPassword),
      ).rejects.toThrow(notFoundError);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        userRecordWithoutPassword.email,
      );
    });

    it('should return null if password is invalid', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue({
        ...userRecordWithoutPassword,
        password: userHashedPassword,
      });

      const result = await service.validateUser(
        userRecordWithoutPassword.email,
        userWrongPassword,
      );

      expect(result).toBeNull();
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        userRecordWithoutPassword.email,
      );
    });
  });

  describe('generateTokens', () => {
    it('should generate valid access and refresh tokens', async () => {
      jest
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce(tokens.access_token.value)
        .mockReturnValueOnce(tokens.refresh_token.value);

      jest
        .spyOn(databaseService.userRefreshToken, 'create')
        .mockResolvedValue(refreshTokenRecord);

      const result = await service.generateTokens(userRecordWithoutPassword);
      const { email, id } = userRecordWithoutPassword;

      expect(result).toEqual({
        access_token: tokens.access_token.value,
        refresh_token: tokens.refresh_token.value,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { email: email, sub: id },
        {
          secret: tokens.access_token.secret,
          expiresIn: tokens.access_token.expiresIn,
        },
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { username: email, sub: id, tokenType: 'refresh' },
        {
          secret: tokens.refresh_token.secret,
          expiresIn: tokens.refresh_token.expiresIn,
        },
      );
      expect(databaseService.userRefreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: id,
          token: tokens.refresh_token.value,
          expires: expect.any(Date),
        },
      });
    });
  });

  describe('refreshToken', () => {
    const newTokens = {
      access_token: {
        ...tokens.access_token,
        value: 'NewAccessToken',
      },
      refresh_token: {
        ...tokens.refresh_token,
        value: 'NewRefreshToken',
      },
    };
    const newAuthTokens: IAuthTokens = {
      access_token: newTokens.access_token.value,
      refresh_token: newTokens.refresh_token.value,
    };

    it('should return new auth tokens if old refresh token is valid', async () => {
      jest
        .spyOn(databaseService.userRefreshToken, 'findUnique')
        .mockResolvedValue(refreshTokenRecord); // as old token
      jest.spyOn(usersService, 'getUserById').mockResolvedValue({
        ...userRecordWithoutPassword,
      });
      jest
        .spyOn(databaseService.userRefreshToken, 'delete')
        .mockResolvedValue(refreshTokenRecord);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(newAuthTokens);

      const result = await service.refreshToken(tokens.refresh_token.value);

      expect(result).toEqual(newAuthTokens);
      expect(databaseService.userRefreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: refreshTokenRecord.token },
      });
      expect(usersService.getUserById).toHaveBeenCalledWith(
        refreshTokenRecord.userId,
      );
      expect(databaseService.userRefreshToken.delete).toHaveBeenCalledWith({
        where: { id: refreshTokenRecord.id },
      });
      expect(service.generateTokens).toHaveBeenCalledWith({
        ...userRecordWithoutPassword,
      });
    });

    it('should throw UnauthorizedException if old refresh token is invalid', async () => {
      jest
        .spyOn(databaseService.userRefreshToken, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.refreshToken('anyNotExistingToken')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(databaseService.userRefreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'anyNotExistingToken' },
      });
    });

    it('should throw UnauthorizedException if old refresh token is expired', async () => {
      const oldRefreshTokenRecord = {
        ...refreshTokenRecord,
        expires: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // now - 30 days
      };

      jest
        .spyOn(databaseService.userRefreshToken, 'findUnique')
        .mockResolvedValue(oldRefreshTokenRecord);

      await expect(
        service.refreshToken(oldRefreshTokenRecord.token),
      ).rejects.toThrow(UnauthorizedException);

      expect(databaseService.userRefreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: oldRefreshTokenRecord.token },
      });
    });

    it('should throw UnauthorizedException if the old refresh token is associated with a non-existent userid', async () => {
      const notFoundError = new NotFoundException('Пользователь не найден');
      const refreshTokenRecordWithNonExistingUserId = {
        ...refreshTokenRecord,
        userId: 'anyNonExistingUserId',
      };

      jest
        .spyOn(databaseService.userRefreshToken, 'findUnique')
        .mockResolvedValue(refreshTokenRecordWithNonExistingUserId);
      jest.spyOn(usersService, 'getUserById').mockRejectedValue(notFoundError);

      await expect(
        service.refreshToken(refreshTokenRecordWithNonExistingUserId.token),
      ).rejects.toThrow(notFoundError);

      expect(databaseService.userRefreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: refreshTokenRecordWithNonExistingUserId.token },
      });
    });
  });

  describe('login', () => {
    it('should return auth tokens if credentials are valid', async () => {
      jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(userRecordWithoutPassword);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(authTokens);

      const result = await service.login(authCredentialsDto);

      expect(result).toEqual(authTokens);
      expect(service.validateUser).toHaveBeenCalledWith(
        userRecordWithoutPassword.email,
        userPassword,
      );
      expect(service.generateTokens).toHaveBeenCalledWith(
        userRecordWithoutPassword,
      );
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({
          ...authCredentialsDto,
          password: userWrongPassword,
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(service.validateUser).toHaveBeenCalledWith(
        authCredentialsDto.email,
        userWrongPassword,
      );
    });
  });

  describe('registerUser', () => {
    it('should return auth tokens after successfully creating and activating a user', async () => {
      jest.spyOn(usersService, 'createUser').mockResolvedValue({
        ...userRecordWithoutPassword,
        password: userHashedPassword,
      });
      jest
        .spyOn(verificationEventService, 'requestUserActivation')
        .mockResolvedValue(undefined);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(authTokens);

      const result = await service.registerUser({
        ...userWithoutPassword,
        password: userHashedPassword,
      });

      expect(result).toEqual(authTokens);
      expect(usersService.createUser).toHaveBeenCalledWith({
        ...userWithoutPassword,
        password: userHashedPassword,
      });

      expect(
        verificationEventService.requestUserActivation,
      ).toHaveBeenCalledWith(userWithoutPassword.email);
      expect(service.generateTokens).toHaveBeenCalledWith({
        ...userRecordWithoutPassword,
        password: userHashedPassword,
      });
    });
  });

  describe('logout', () => {
    it('should delete the refresh token if it exists and has an associated userId', async () => {
      jest
        .spyOn(databaseService.userRefreshToken, 'findUnique')
        .mockResolvedValue(refreshTokenRecord);
      jest
        .spyOn(databaseService.userRefreshToken, 'deleteMany')
        .mockResolvedValue({ count: 1 });

      await expect(
        service.logout(tokens.refresh_token.value),
      ).resolves.toBeUndefined();

      expect(databaseService.userRefreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: tokens.refresh_token.value },
      });
      expect(databaseService.userRefreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: userRecordWithoutPassword.id },
      });
    });

    it('should throw UnauthorizedException if the refresh token is not found', async () => {
      jest
        .spyOn(databaseService.userRefreshToken, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.logout('anyNotExistingToken')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(databaseService.userRefreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'anyNotExistingToken' },
      });
    });
  });

  describe('resetPasswordRequest', () => {
    it('should request password reset if user is found, active, and not blocked', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue({
        ...userRecordWithoutPassword,
        password: userHashedPassword,
        isActive: true,
        isBlocked: false,
      });
      jest
        .spyOn(verificationEventService, 'requestUserPasswordReset')
        .mockResolvedValue(undefined);

      await expect(
        service.resetPasswordRequest(userRecordWithoutPassword.email),
      ).resolves.toBeUndefined();

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        userRecordWithoutPassword.email,
      );
      expect(
        verificationEventService.requestUserPasswordReset,
      ).toHaveBeenCalledWith(userRecordWithoutPassword.email);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const notFoundError = new NotFoundException('Пользователь не найден');
      jest
        .spyOn(usersService, 'findOneByEmail')
        .mockRejectedValue(notFoundError);

      await expect(
        service.resetPasswordRequest('anyNotExistingUserEmail'),
      ).rejects.toThrow(notFoundError);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        'anyNotExistingUserEmail',
      );
    });

    it('should throw ForbiddenException if user is not active', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue({
        ...userRecordWithoutPassword,
        password: userHashedPassword,
        isActive: false,
        isBlocked: false,
      });

      await expect(
        service.resetPasswordRequest(userRecordWithoutPassword.email),
      ).rejects.toThrow(ForbiddenException);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        userRecordWithoutPassword.email,
      );
    });

    it('should throw ForbiddenException if user is blocked', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue({
        ...userRecordWithoutPassword,
        password: userHashedPassword,
        isActive: true,
        isBlocked: true,
      });

      await expect(
        service.resetPasswordRequest(userRecordWithoutPassword.email),
      ).rejects.toThrow(ForbiddenException);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        userRecordWithoutPassword.email,
      );
    });
  });

  describe('resetPassword', () => {
    it('should verify user password reset', async () => {
      jest
        .spyOn(verificationEventService, 'verifyUserPasswordReset')
        .mockResolvedValue(undefined);

      await expect(
        service.resetPassword('someResetToken', 'newPassword'),
      ).resolves.toBeUndefined();

      expect(
        verificationEventService.verifyUserPasswordReset,
      ).toHaveBeenCalledWith('someResetToken', 'newPassword');
    });
  });

  describe('activateUser', () => {
    it('should activate user', async () => {
      jest
        .spyOn(verificationEventService, 'activateUser')
        .mockResolvedValue(undefined);

      await expect(
        service.activateUser('someActivationToken'),
      ).resolves.toBeUndefined();

      expect(verificationEventService.activateUser).toHaveBeenCalledWith(
        'someActivationToken',
      );
    });
  });
});
