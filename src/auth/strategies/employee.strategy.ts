import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Employee } from '@prisma/client';
import { DatabaseService } from 'src/core/database';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * User authentication strategy using JWT.
 * Uses a separate secret for the employee jwt token
 */
@Injectable()
export class EmployeeStrategy extends PassportStrategy(
  Strategy,
  'employee-strategy',
) {
  constructor(private database: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.EMPLOYEE_JWT_ACCESS_SECRET,
    });
  }

  /**
   * Method to validate JWT and get employee from database.
   *
   * @param {JwtPayload} payload - Parsed JWT payload
   * @returns {Promise<Omit<Employee, 'password'>>} - Employee data without password
   * @throws {UnauthorizedException} - If the employee is not found
   */
  async validate(payload: JwtPayload): Promise<Omit<Employee, 'password'>> {
    const employee = await this.database.employee.findUnique({
      where: { id: payload.sub },
    });

    if (!employee) {
      throw new UnauthorizedException();
    }

    const { password, ...result } = employee;
    return result;
  }
}
