import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';
import { EmployeesAuth } from '../../auth/decorators/employees.auth';
import { Employee } from '@prisma/client';

@ApiTags('Employee')
@Controller('Employee')
@EmployeesAuth()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать сотрудника' })
  @ApiResponse({ status: 201, description: 'Сотрудник успешно создан' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Сотрудник с таким email уже существует',
    type: FieldConflictException,
  })
  @ApiResponse({ status: 400, description: 'Неверный запрос' })
  async createEmployee(@Body() CreateEmployeeDto: CreateEmployeeDto) {
    return await this.employeeService.createEmployee(CreateEmployeeDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить сотрудника по ID' })
  @ApiResponse({ status: 200, description: 'Сотрудник найден' })
  @ApiResponse({ status: 404, description: 'Сотрудник не найден' })
  async findEmployeeById(@Param('id') id: string) {
    return await this.employeeService.findEmployeeById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Получение списка всех сотрудников' })
  @ApiResponse({ status: 200, description: 'Список всех сотрудников получен' })
  async findAllEmployees(): Promise<Omit<Employee, 'password'>[]> {
    return this.employeeService.findAllEmployees();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить сотрудника' })
  @ApiResponse({ status: 200, description: 'Сотрудник обновлен' })
  @ApiResponse({ status: 404, description: 'Сотрудник не найден' })
  async updateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeeService.updateEmployee(id, updateEmployeeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить сотрудника' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Сотрудник удален',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Сотрудник не найден',
  })
  async deleteEmployee(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.employeeService.deleteEmployee(id);
  }
}
