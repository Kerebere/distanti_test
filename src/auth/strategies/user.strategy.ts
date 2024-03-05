import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { User } from '@prisma/client';
import { DatabaseService } from 'src/core/database';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * User authentication strategy using JWT.
 * Uses a separate secret for the user jwt token
 */
@Injectable()
export class UserStrategy extends PassportStrategy(Strategy, 'user-strategy') {
  constructor(private database: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.USER_JWT_ACCESS_SECRET,
    });
  }

  /**
   * Method to validate JWT and get user from database.
   *
   * @param {JwtPayload} payload - Parsed JWT payload
   * @returns {Promise<Omit<User, 'password'>>} - User data without password
   * @throws {UnauthorizedException} - If the user is not found
   */
  async validate(payload: JwtPayload): Promise<Omit<User, 'password'>> {
    const user = await this.database.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const { password, ...result } = user;
    return result;
  }
}
