import {
  Controller,
  HttpCode,
  HttpStatus,
  Get,
  Post,
  Put,
  ParseUUIDPipe,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubgroupService } from './subgroup.service';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';
import { CreateSubgroupDto } from './dto/create-subgroup.dto';
import { UpdateSubgroupDto } from './dto/update-subgroup.dto';
import { EmployeesAuth } from '../../auth/decorators/employees.auth';

@ApiTags('Subgroup')
@Controller('subgroups')
@EmployeesAuth()
export class SubgroupController {
  constructor(private readonly subgroupService: SubgroupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создание новой подгруппы' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Новая подгруппа создана',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Подгруппа с таким именем уже существует',
    type: FieldConflictException,
  })
  async create(@Body() createSubgroupDto: CreateSubgroupDto) {
    return this.subgroupService.create(createSubgroupDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение списка всех подгрупп' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Список всех подгрупп получен',
  })
  async getAll() {
    return this.subgroupService.getAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение подгруппы' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Подгруппа получена',
  })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subgroupService.getOne(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление подгруппы по идентификатору' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Подгруппа обновлена' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Подгруппа не найдена',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGroupDto: UpdateSubgroupDto,
  ) {
    return this.subgroupService.update(id, updateGroupDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удаление подгруппы по идентификатору' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Подгруппа удалена',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Подгруппа не найдена',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.subgroupService.delete(id);
  }
}
