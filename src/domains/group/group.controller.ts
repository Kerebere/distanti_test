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
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GroupService } from './group.service';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';
import { CreateGroupDto } from './dto/create-group-dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { EmployeesAuth } from '../../auth/decorators/employees.auth';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Groups')
@Controller('groups')
@EmployeesAuth()
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создание новой группы' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Новая группа создана',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Группа с таким именем уже существует',
    type: FieldConflictException,
  })
  async create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupService.create(createGroupDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получение списка всех групп' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Список всех групп получен',
  })
  async get() {
    return this.groupService.getAll();
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление группы по идентификатору' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Группа обновлена' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Группа не найдена',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('icon'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    icon?: Express.Multer.File,
  ) {
    return this.groupService.update(id, updateGroupDto, icon);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удаление группы по идентификатору' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Группа удалена',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Группа не найдена',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.groupService.delete(id);
  }
}
