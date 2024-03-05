import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class UserOrEmployeeGuard extends AuthGuard([
  'user-strategy',
  'employee-strategy',
]) {}
