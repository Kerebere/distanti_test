import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeRepository } from './employee.repository';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';
import { Employee } from '@prisma/client';

@Injectable()
export class EmployeeService {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async createEmployee(createEmployeeDto: CreateEmployeeDto) {
    const existingEmployee = await this.employeeRepository.findEmployeeByEmail(
      createEmployeeDto.email,
    );
    if (existingEmployee) {
      throw new FieldConflictException(
        'email',
        'Сотрудник с таким email уже существует',
      );
    }

    return this.employeeRepository.createEmployee(createEmployeeDto);
  }

  async findEmployeeById(id: string) {
    const employee = await this.employeeRepository.findOne(id);
    if (!employee) {
      throw new NotFoundException('Сотрудник не найден');
    }
    return employee;
  }

  async findAllEmployees(): Promise<Omit<Employee, 'password'>[]> {
    return this.employeeRepository.findAllEmployees();
  }
  async updateEmployee(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const existingEmployee = await this.employeeRepository.findEmployeeById(id);
    if (!existingEmployee) {
      throw new NotFoundException('Сотрудник не найден');
    }
    if (updateEmployeeDto.email) {
      const employeeByEmail = await this.employeeRepository.findEmployeeByEmail(
        updateEmployeeDto.email,
      );
      if (employeeByEmail && employeeByEmail.id !== id) {
        throw new FieldConflictException(
          'email',
          'Сотрудник с таким email уже существует',
        );
      }
    }

    return this.employeeRepository.updateEmployee(id, updateEmployeeDto);
  }

  async deleteEmployee(id: string): Promise<void> {
    const existingEmployee = await this.employeeRepository.findOne(id);
    if (!existingEmployee) {
      throw new NotFoundException('Сотрудник не найден');
    }
    return this.employeeRepository.deleteEmployee(id);
  }

  async findEmployeeByEmail(email: string) {
    const employee = await this.employeeRepository.findEmployeeByEmail(email);

    if (!employee) {
      throw new NotFoundException('Сотрудник не найден');
    }

    return employee;
  }

  async resetPassword(email: string, newPassword: string) {
    const employee = await this.employeeRepository.findEmployeeByEmail(email);

    if (!employee) {
      throw new NotFoundException('Сотрудник не найден');
    }

    await this.employeeRepository.updatePassword(employee.id, newPassword);
  }

  async activateEmployee(email: string) {
    const employee = await this.employeeRepository.findEmployeeByEmail(email);

    if (!employee) {
      throw new NotFoundException('Сотрудник не найден');
    }

    await this.employeeRepository.updateIsActiveStatus(employee.id, true);
  }
}
