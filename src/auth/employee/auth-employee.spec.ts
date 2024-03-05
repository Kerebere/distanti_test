import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { hashSync } from 'bcrypt';
import { DatabaseService } from 'src/core/database';
import { EmployeeService } from 'src/domains/employee/employee.service';
import { VerificationEventService } from 'src/domains/verification-event/verification-event.service';
import { AuthEmployeeService } from './auth-employee.service';
import { AuthCredentialsDto } from '../dto/auth-credentials.dto';
import { IAuthTokens } from '../interfaces/auth-tokens.interface';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('AuthEmployeeService', () => {
  let service: AuthEmployeeService;
  let employeeService: EmployeeService;
  let jwtService: JwtService;
  let databaseService: DatabaseService;
  let verificationEventService: VerificationEventService;

  const employeePassword = 'somepassword';
  const employeeWrongPassword = 'somewrongpassword';
  const employeeHashedPassword = hashSync(employeePassword, 10);
  const employeeWithoutPassword = {
    firstName: 'John',
    middleName: '',
    lastName: 'Doe',
    email: 'jogndoe@mail.com',
    role: 'admin',
    isBlocked: false,
    isActive: false,
  };
  const employeeRecordWithoutPassword = {
    ...employeeWithoutPassword,
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tokens = {
    access_token: {
      value: 'SomeAccessToken',
      secret: process.env.EMPLOYEE_JWT_ACCESS_SECRET,
      expiresIn: '15m',
    },
    refresh_token: {
      value: 'SomeRefreshToken',
      secret: process.env.EMPLOYEE_JWT_REFRESH_SECRET,
      expiresIn: '7d',
      duration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // now + 7 days
    },
  };

  // refresh token entity from database
  const refreshTokenRecord = {
    id: '1',
    token: tokens.refresh_token.value,
    expires: tokens.refresh_token.duration,
    employeeId: employeeRecordWithoutPassword.id,
    userId: null,
  };

  const authCredentialsDto: AuthCredentialsDto = {
    email: employeeRecordWithoutPassword.email,
    password: employeePassword,
    rememberMe: true,
  };
  const authTokens: IAuthTokens = {
    access_token: tokens.access_token.value,
    refresh_token: tokens.refresh_token.value,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthEmployeeService,
        {
          provide: EmployeeService,
          useValue: {
            findEmployeeByEmail: jest.fn(),
            findEmployeeById: jest.fn(),
            createEmployee: jest.fn(),
          },
        },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        {
          provide: DatabaseService,
          useValue: {
            employeeRefreshToken: {
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
            requestEmployeeActivation: jest.fn(),
            requestEmployeePasswordReset: jest.fn(),
            verifyEmployeePasswordReset: jest.fn(),
            activateEmployee: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthEmployeeService>(AuthEmployeeService);
    employeeService = module.get<EmployeeService>(EmployeeService);
    jwtService = module.get<JwtService>(JwtService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    verificationEventService = module.get<VerificationEventService>(
      VerificationEventService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate', () => {
    it('should return employee without password if credentials are valid', async () => {
      jest.spyOn(employeeService, 'findEmployeeByEmail').mockResolvedValue({
        ...employeeRecordWithoutPassword,
        password: employeeHashedPassword,
      });

      const result = await service.validate(
        employeeRecordWithoutPassword.email,
        employeePassword,
      );

      expect(result).toEqual(employeeRecordWithoutPassword);
      expect(employeeService.findEmployeeByEmail).toHaveBeenCalledWith(
        employeeRecordWithoutPassword.email,
      );
    });

    it('should return null if employee is not found', async () => {
      const notFoundError = new NotFoundException('Сотрудник не найден');
      jest
        .spyOn(employeeService, 'findEmployeeByEmail')
        .mockRejectedValue(notFoundError);

      await expect(
        service.validate(employeeRecordWithoutPassword.email, employeePassword),
      ).rejects.toThrow(notFoundError);

      expect(employeeService.findEmployeeByEmail).toHaveBeenCalledWith(
        employeeRecordWithoutPassword.email,
      );
    });

    it('should return null if password is invalid', async () => {
      jest.spyOn(employeeService, 'findEmployeeByEmail').mockResolvedValue({
        ...employeeRecordWithoutPassword,
        password: employeeHashedPassword,
      });

      const result = await service.validate(
        employeeRecordWithoutPassword.email,
        employeeWrongPassword,
      );

      expect(result).toBeNull();
      expect(employeeService.findEmployeeByEmail).toHaveBeenCalledWith(
        employeeRecordWithoutPassword.email,
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
        .spyOn(databaseService.employeeRefreshToken, 'create')
        .mockResolvedValue(refreshTokenRecord);

      const result = await service.generateTokens(
        employeeRecordWithoutPassword,
      );
      const { email, id } = employeeRecordWithoutPassword;

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
      expect(databaseService.employeeRefreshToken.create).toHaveBeenCalledWith({
        data: {
          employeeId: id,
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
        .spyOn(databaseService.employeeRefreshToken, 'findUnique')
        .mockResolvedValue(refreshTokenRecord); // as old token
      jest.spyOn(employeeService, 'findEmployeeById').mockResolvedValue({
        ...employeeRecordWithoutPassword,
        password: employeeHashedPassword,
      });
      jest
        .spyOn(databaseService.employeeRefreshToken, 'delete')
        .mockResolvedValue(refreshTokenRecord);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(newAuthTokens);

      const result = await service.refreshToken(tokens.refresh_token.value);

      expect(result).toEqual(newAuthTokens);
      expect(
        databaseService.employeeRefreshToken.findUnique,
      ).toHaveBeenCalledWith({
        where: { token: refreshTokenRecord.token },
      });
      expect(employeeService.findEmployeeById).toHaveBeenCalledWith(
        refreshTokenRecord.employeeId,
      );
      expect(databaseService.employeeRefreshToken.delete).toHaveBeenCalledWith({
        where: { id: refreshTokenRecord.id },
      });
      expect(service.generateTokens).toHaveBeenCalledWith({
        ...employeeRecordWithoutPassword,
        password: employeeHashedPassword,
      });
    });

    it('should throw UnauthorizedException if old refresh token is invalid', async () => {
      jest
        .spyOn(databaseService.employeeRefreshToken, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.refreshToken('anyNotExistingToken')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(
        databaseService.employeeRefreshToken.findUnique,
      ).toHaveBeenCalledWith({
        where: { token: 'anyNotExistingToken' },
      });
    });

    it('should throw UnauthorizedException if old refresh token is expired', async () => {
      const oldRefreshTokenRecord = {
        ...refreshTokenRecord,
        expires: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // now - 30 days
      };

      jest
        .spyOn(databaseService.employeeRefreshToken, 'findUnique')
        .mockResolvedValue(oldRefreshTokenRecord);

      await expect(
        service.refreshToken(oldRefreshTokenRecord.token),
      ).rejects.toThrow(UnauthorizedException);

      expect(
        databaseService.employeeRefreshToken.findUnique,
      ).toHaveBeenCalledWith({
        where: { token: oldRefreshTokenRecord.token },
      });
    });

    it('should throw UnauthorizedException if the old refresh token is associated with a non-existent employeeId', async () => {
      const notFoundError = new NotFoundException('Сотрудник не найден');
      const refreshTokenRecordWithNonExistingEmployeeId = {
        ...refreshTokenRecord,
        employeeId: 'anyNonExistingEmployeeId',
      };

      jest
        .spyOn(databaseService.employeeRefreshToken, 'findUnique')
        .mockResolvedValue(refreshTokenRecordWithNonExistingEmployeeId);
      jest
        .spyOn(employeeService, 'findEmployeeById')
        .mockRejectedValue(notFoundError);

      await expect(
        service.refreshToken(refreshTokenRecordWithNonExistingEmployeeId.token),
      ).rejects.toThrow(notFoundError);

      expect(
        databaseService.employeeRefreshToken.findUnique,
      ).toHaveBeenCalledWith({
        where: { token: refreshTokenRecordWithNonExistingEmployeeId.token },
      });
    });
  });

  describe('login', () => {
    it('should return auth tokens if credentials are valid', async () => {
      jest
        .spyOn(service, 'validate')
        .mockResolvedValue(employeeRecordWithoutPassword);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(authTokens);

      const result = await service.login(authCredentialsDto);

      expect(result).toEqual(authTokens);
      expect(service.validate).toHaveBeenCalledWith(
        employeeRecordWithoutPassword.email,
        employeePassword,
      );
      expect(service.generateTokens).toHaveBeenCalledWith(
        employeeRecordWithoutPassword,
      );
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      jest.spyOn(service, 'validate').mockResolvedValue(null);

      await expect(
        service.login({
          ...authCredentialsDto,
          password: employeeWrongPassword,
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(service.validate).toHaveBeenCalledWith(
        authCredentialsDto.email,
        employeeWrongPassword,
      );
    });
  });

  describe('register', () => {
    it('should return auth tokens after successfully creating and activating an employee', async () => {
      jest.spyOn(employeeService, 'createEmployee').mockResolvedValue({
        ...employeeRecordWithoutPassword,
        password: employeeHashedPassword,
      });
      jest
        .spyOn(verificationEventService, 'requestEmployeeActivation')
        .mockResolvedValue(undefined);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(authTokens);

      const result = await service.register({
        ...employeeWithoutPassword,
        password: employeeHashedPassword,
      });

      expect(result).toEqual(authTokens);
      expect(employeeService.createEmployee).toHaveBeenCalledWith({
        ...employeeWithoutPassword,
        password: employeeHashedPassword,
      });

      expect(
        verificationEventService.requestEmployeeActivation,
      ).toHaveBeenCalledWith(employeeWithoutPassword.email);
      expect(service.generateTokens).toHaveBeenCalledWith({
        ...employeeRecordWithoutPassword,
        password: employeeHashedPassword,
      });
    });
  });

  describe('logout', () => {
    it('should delete the refresh token if it exists and has an associated employeeId', async () => {
      jest
        .spyOn(databaseService.employeeRefreshToken, 'findUnique')
        .mockResolvedValue(refreshTokenRecord);
      jest
        .spyOn(databaseService.employeeRefreshToken, 'deleteMany')
        .mockResolvedValue({ count: 1 });

      await expect(
        service.logout(tokens.refresh_token.value),
      ).resolves.toBeUndefined();

      expect(
        databaseService.employeeRefreshToken.findUnique,
      ).toHaveBeenCalledWith({
        where: { token: tokens.refresh_token.value },
      });
      expect(
        databaseService.employeeRefreshToken.deleteMany,
      ).toHaveBeenCalledWith({
        where: { employeeId: employeeRecordWithoutPassword.id },
      });
    });

    it('should throw UnauthorizedException if the refresh token is not found', async () => {
      jest
        .spyOn(databaseService.employeeRefreshToken, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.logout('anyNotExistingToken')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(
        databaseService.employeeRefreshToken.findUnique,
      ).toHaveBeenCalledWith({
        where: { token: 'anyNotExistingToken' },
      });
    });
  });

  describe('resetPasswordRequest', () => {
    it('should request password reset if employee is found and active', async () => {
      jest.spyOn(employeeService, 'findEmployeeByEmail').mockResolvedValue({
        ...employeeRecordWithoutPassword,
        password: employeeHashedPassword,
        isActive: true,
        isBlocked: false,
      });
      jest
        .spyOn(verificationEventService, 'requestEmployeePasswordReset')
        .mockResolvedValue(undefined);

      await service.resetPasswordRequest(employeeWithoutPassword.email);

      expect(employeeService.findEmployeeByEmail).toHaveBeenCalledWith(
        employeeWithoutPassword.email,
      );
      expect(
        verificationEventService.requestEmployeePasswordReset,
      ).toHaveBeenCalledWith(employeeWithoutPassword.email);
    });

    it('should throw NotFoundException if employee is not found', async () => {
      const notFoundError = new NotFoundException('Сотрудник не найден');

      jest
        .spyOn(employeeService, 'findEmployeeByEmail')
        .mockRejectedValue(notFoundError);

      await expect(
        service.resetPasswordRequest('anyWrongEmployeeEmail'),
      ).rejects.toThrow(notFoundError);

      expect(employeeService.findEmployeeByEmail).toHaveBeenCalledWith(
        'anyWrongEmployeeEmail',
      );
    });

    it('should throw ForbiddenException if employee is not active', async () => {
      const notActiveEmployeeRecord = {
        ...employeeRecordWithoutPassword,
        password: employeeHashedPassword,
        isActive: false,
      };

      jest
        .spyOn(employeeService, 'findEmployeeByEmail')
        .mockResolvedValue(notActiveEmployeeRecord);

      await expect(
        service.resetPasswordRequest(notActiveEmployeeRecord.email),
      ).rejects.toThrow(ForbiddenException);

      expect(employeeService.findEmployeeByEmail).toHaveBeenCalledWith(
        notActiveEmployeeRecord.email,
      );
    });

    it('should throw ForbiddenException if employee is blocked', async () => {
      const blockedEmployeeRecord = {
        ...employeeRecordWithoutPassword,
        password: employeeHashedPassword,
        isBlocked: false,
      };

      jest
        .spyOn(employeeService, 'findEmployeeByEmail')
        .mockResolvedValue(blockedEmployeeRecord);

      await expect(
        service.resetPasswordRequest(blockedEmployeeRecord.email),
      ).rejects.toThrow(ForbiddenException);

      expect(employeeService.findEmployeeByEmail).toHaveBeenCalledWith(
        blockedEmployeeRecord.email,
      );
    });
  });
});
