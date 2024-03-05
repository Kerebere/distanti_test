import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserAuthGuard } from '../guards/user-auth.guard';

/**
 * Decorator, which passes the request further if the sender is a user
 */
export function UserAuth() {
  return applyDecorators(UseGuards(UserAuthGuard), ApiBearerAuth('User'));
}
