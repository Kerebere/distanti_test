import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserOrEmployeeGuard } from '../guards/employee-or-user.guard';

/**
 * Decorator, which passes the request further if the sender is an employee or a user
 */
export function UserOrEmployeeAuth() {
  return applyDecorators(
    UseGuards(UserOrEmployeeGuard),
    ApiBearerAuth('Employee or user'),
  );
}
