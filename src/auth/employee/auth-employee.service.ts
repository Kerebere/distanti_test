import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EmployeeService } from 'src/domains/employee/employee.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { Employee } from '@prisma/client';
import { DatabaseService } from 'src/core/database';
import { AuthCredentialsDto } from '../dto/auth-credentials.dto';
import { CreateEmployeeDto } from 'src/domains/employee/dto/create-employee.dto';
import { IAuthTokens } from '../interfaces/auth-tokens.interface';
import { VerificationEventService } from 'src/domains/verification-event/verification-event.service';

/**
 * AuthEmployeeService class handles authentication and authorization logic for employees.
 *
 * This class provides methods for validating employee credentials, generating tokens,
 * refreshing tokens, registering employee, logging out, resetting employee password
 * and employee activation.
 *
 * @remarks
 * This class is decorated with `@Injectable()` to indicate that it can be injected
 * as a dependency.
 */
@Injectable()
export class AuthEmployeeService {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly jwtService: JwtService,
    private readonly database: DatabaseService,
    private readonly verificationEventService: VerificationEventService,
  ) {}

  /**
   * Validates the employee credentials.
   * It checks if an employee with passed email exists and compares the hashed password
   *
   * @param {string} email - The email of the employee.
   * @param {string} password - The password of the employee.
   *
   * @return {Omit<Employee, 'password'> | null} Returns the employee information if there is an employee with the passed email and password, otherwise returns null.
   */
  async validate(
    email: string,
    password: string,
  ): Promise<Omit<Employee, 'password'> | null> {
    const employee = await this.employeeService.findEmployeeByEmail(email);

    const isPasswordValid = await compare(password, employee.password);

    if (isPasswordValid) {
      const { password, ...result } = employee;
      return result;
    }

    return null;
  }

  /**
   * Logs in an employee with the given credentials.
   *
   * @param {AuthCredentialsDto} credentials - The authentication credentials of the employee (email and password).
   * @returns {Promise<IAuthTokens>} A promise that resolves to an object containing the generated tokens for the employee.
   * @throws {UnauthorizedException} If the provided credentials are invalid.
   */
  async login(credentials: AuthCredentialsDto): Promise<IAuthTokens> {
    const employee = await this.validate(
      credentials.email,
      credentials.password,
    );

    if (!employee) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    return this.generateTokens(employee);
  }

  /**
   * Refreshes the access and refresh tokens for the given old refresh token.
   * It generates new refresh and access tokens and removes the old refresh token from the database.
   *
   * @param {string} oldRefreshToken - The old refresh token to be refreshed.
   * @returns {Promise<IAuthTokens>} - A promise that resolves to an object containing the new access token and refresh token.
   * @throws {UnauthorizedException} - If the old refresh token is invalid or expired.
   * @throws {UnauthorizedException} - If the employee associated with the old refresh token is not found.
   */
  async refreshToken(oldRefreshToken: string): Promise<IAuthTokens> {
    const oldRefreshTokenRecord =
      await this.database.employeeRefreshToken.findUnique({
        where: { token: oldRefreshToken },
      });

    if (!oldRefreshTokenRecord || oldRefreshTokenRecord.expires < new Date()) {
      throw new UnauthorizedException('Неверный или истекший refresh токен');
    }

    const employee = await this.employeeService.findEmployeeById(
      oldRefreshTokenRecord.employeeId,
    );

    await this.database.employeeRefreshToken.delete({
      where: { id: oldRefreshTokenRecord.id },
    });

    return await this.generateTokens(employee);
  }

  /**
   * Generates access and refresh tokens for an employee.
   * Save the refresh token to the database.
   *
   * @param {Omit<Employee, 'password'>} employee - The employee object without the password field.
   * @return {Promise<IAuthTokens>} - The generated access and refresh tokens.
   */
  async generateTokens(
    employee: Omit<Employee, 'password'>,
  ): Promise<IAuthTokens> {
    const accessTokenPayload = { email: employee.email, sub: employee.id };
    const refreshTokenPayload = {
      username: employee.email,
      sub: employee.id,
      tokenType: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: process.env.EMPLOYEE_JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: process.env.EMPLOYEE_JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);

    await this.database.employeeRefreshToken.create({
      data: {
        employeeId: employee.id,
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
   * Registers a new employee.
   * Creates an employee in the database and sends a letter to activate the employee
   *
   * @param {CreateEmployeeDto} createEmployeeDto - The employee data for creating a new employee.
   * @return {Promise<IAuthTokens>} - A promise that resolves to an object containing access_token and refresh_token.
   */
  async register(createEmployeeDto: CreateEmployeeDto): Promise<IAuthTokens> {
    const employee = await this.employeeService.createEmployee(
      createEmployeeDto,
    );
    await this.verificationEventService.requestEmployeeActivation(
      employee.email,
    );
    return this.generateTokens(employee);
  }

  /**
   * Logout method finds all tokens that were created by the owner of the passed token
   * and deletes them, including the passed token
   *
   * @param {string} refreshToken - Token through which other tokens will be found
   * @return {Promise<void>} - A promise that resolves when the deletion is complete
   */
  async logout(refreshToken: string): Promise<void> {
    const token = await this.database.employeeRefreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!token) {
      throw new UnauthorizedException('Токен не найден');
    }

    await this.database.employeeRefreshToken.deleteMany({
      where: { employeeId: token.employeeId },
    });
  }

  /**
   * Send password reset email to employee, create password reset event data in database
   *
   * @param {string} email - Email of the employee who wants to change the password
   * @returns {Promise<void>} - A promise that resolves when the email is sent
   * @throws {UnauthorizedException} - If the employee is not found
   * @throws {UnauthorizedException} - If the employee is not active
   * @throws {UnauthorizedException} - If the employee is blocked
   */
  async resetPasswordRequest(email: string): Promise<void> {
    const employee = await this.employeeService.findEmployeeByEmail(email);

    if (!employee) {
      throw new NotFoundException('Сотрудник не найден');
    }

    if (!employee.isActive) {
      throw new ForbiddenException('Сотрудник не активирован');
    }

    if (employee.isBlocked) {
      throw new ForbiddenException('Сотрудник заблокирован');
    }

    await this.verificationEventService.requestEmployeePasswordReset(email);
  }

  /**
   * Reset employee password
   * Find password reset data by token and change password to {newPassword}
   *
   * @param {string} token - A token that defines a password reset event
   * @param {string} newPassword - Employees new password
   * @returns {Promise<void>} - A promise that resolves when password is changed
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.verificationEventService.verifyEmployeePasswordReset(
      token,
      newPassword,
    );
  }

  /**
   * Activate employee
   * Find employee activation data by token and make employee active
   *
   * @param {string} token - A token that defines a password reset event
   * @returns {Promise<void>} - A promise that resolves when employee is active
   */
  async activateEmployee(token: string): Promise<void> {
    await this.verificationEventService.activateEmployee(token);
  }
}
