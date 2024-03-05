import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesAuthGuard } from '../guards/employees-auth.guard';

/**
 * Decorator, which passes the request further if the sender is an employee
 */
export function EmployeesAuth() {
  return applyDecorators(
    UseGuards(EmployeesAuthGuard),
    ApiBearerAuth('Employee'),
  );
}
