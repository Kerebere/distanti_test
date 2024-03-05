import { Injectable } from '@nestjs/common';
import { Employee } from '@prisma/client';
import { DatabaseService } from '../../core/database';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { hash } from 'bcrypt';

@Injectable()
export class EmployeeRepository {
  constructor(private database: DatabaseService) {}

  async createEmployee(data: CreateEmployeeDto): Promise<Employee> {
    return this.database.employee.create({ data });
  }

  async findOne(id: string): Promise<Employee | null> {
    return this.database.employee.findUnique({ where: { id } });
  }

  async findAllEmployees(): Promise<Omit<Employee, 'password'>[]> {
    return this.database.employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        role: true,
        password: false,
        isBlocked: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async findEmployeeByEmail(email: string): Promise<Employee | null> {
    return this.database.employee.findUnique({
      where: {
        email,
      },
    });
  }

  async findEmployeeById(id: string): Promise<Employee | null> {
    return this.database.employee.findUnique({
      where: {
        id,
      },
    });
  }
  async updateEmployee(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.database.employee.update({
      where: { id },
      data: updateEmployeeDto,
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.database.employee.delete({
      where: { id },
    });
  }

  async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await hash(newPassword, 10);
    await this.database.employee.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
  }

  async updateIsActiveStatus(id: string, isActive: boolean) {
    await this.database.employee.update({
      where: { id },
      data: { isActive },
    });
  }
}
