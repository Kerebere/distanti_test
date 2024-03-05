import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from './group.service';
import { GroupRepository } from './group.repository';
import { FieldConflictException } from '../../common/exceptions/field-conflict.exception';
import { NotFoundException } from '@nestjs/common';
import { S3Service } from '../../common/s3/s3.service';
import { Readable } from 'stream';

const createTestFile = (
  fileName: string,
  content: string,
  mimeType = 'text/plain',
): Express.Multer.File => ({
  originalname: fileName,
  buffer: Buffer.from(content),
  mimetype: mimeType,
  size: Buffer.from(content).length,
  fieldname: 'file',
  encoding: '7bit',
  destination: '',
  filename: '',
  path: '',
  stream: Readable.from([content]),
});

describe('GroupService', () => {
  let service: GroupService;
  let groupRepository: GroupRepository;
  let s3Service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: GroupRepository,
          useFactory: () => ({
            findUnique: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          }),
        },
        {
          provide: S3Service,
          useFactory: () => ({
            uploadFile: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    groupRepository = module.get<GroupRepository>(GroupRepository);
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new group', async () => {
      const createGroupDto = { name: 'Group', iconUrl: 'url.com' };
      const createdGroup = { id: '1', ...createGroupDto };

      jest.spyOn(groupRepository, 'findUnique').mockResolvedValue(null);
      jest.spyOn(groupRepository, 'create').mockResolvedValue(createdGroup);

      await expect(service.create(createGroupDto)).resolves.toEqual(
        createdGroup,
      );
      expect(groupRepository.findUnique).toHaveBeenCalledWith({
        name: createGroupDto.name,
      });
      expect(groupRepository.create).toHaveBeenCalledWith(createGroupDto);
    });

    it('should throw FieldConflictException if group with the same name already exists', async () => {
      const createGroupDto = { name: 'Group', iconUrl: 'url.com' };
      const createdGroup = { id: '1', ...createGroupDto };

      jest.spyOn(groupRepository, 'findUnique').mockResolvedValue(createdGroup);

      await expect(service.create(createGroupDto)).rejects.toThrowError(
        FieldConflictException,
      );
      expect(groupRepository.findUnique).toHaveBeenCalledWith({
        name: createGroupDto.name,
      });
    });
  });

  describe('getAll', () => {
    it('should return all groups', async () => {
      const groups = [
        { id: '1', name: 'Group 1', iconUrl: 'url.com' },
        { id: '2', name: 'Group 2', iconUrl: null },
      ];

      jest.spyOn(groupRepository, 'findAll').mockResolvedValue(groups);

      await expect(service.getAll()).resolves.toEqual(groups);
      expect(groupRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing group (without file)', async () => {
      const group = { id: '1', name: 'Old name', iconUrl: 'Old iconUrl' };
      const updateGroupDto = { name: 'Updated name' };

      jest.spyOn(groupRepository, 'findUnique').mockResolvedValue(group);
      jest.spyOn(groupRepository, 'update').mockResolvedValue({
        id: group.id,
        iconUrl: group.iconUrl,
        ...updateGroupDto,
      });

      await expect(service.update(group.id, updateGroupDto)).resolves.toEqual({
        id: group.id,
        iconUrl: group.iconUrl,
        ...updateGroupDto,
      });
      expect(groupRepository.findUnique).toHaveBeenCalledWith({ id: group.id });
      expect(groupRepository.update).toHaveBeenCalledWith(group.id, {
        ...updateGroupDto,
        iconUrl: group.iconUrl,
      });
    });

    it('should throw NotFoundException if group to update is not found', async () => {
      const group = { id: '1', name: 'Old name', iconUrl: 'Old iconUrl' };
      const updateGroupDto = {
        name: 'Updated name',
        iconUrl: 'Updated iconUrl',
      };

      jest.spyOn(groupRepository, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update(group.id, updateGroupDto),
      ).rejects.toThrowError(NotFoundException);
    });

    it('should update an existing group (with file)', async () => {
      const file = createTestFile('icon.png', 'Some icon content');
      const fileUrl = 'iconurl.com';
      const group = { id: '1', name: 'Old name', iconUrl: 'Old iconUrl' };
      const updateGroupDto = { name: 'Updated name' };

      jest.spyOn(groupRepository, 'findUnique').mockResolvedValue(group);
      jest
        .spyOn(s3Service, 'uploadFile')
        .mockResolvedValue({ url: fileUrl, Key: file.originalname });
      jest.spyOn(groupRepository, 'update').mockResolvedValue({
        id: group.id,
        iconUrl: fileUrl,
        ...updateGroupDto,
      });

      await expect(
        service.update(group.id, updateGroupDto, file),
      ).resolves.toEqual({
        id: group.id,
        iconUrl: fileUrl,
        ...updateGroupDto,
      });
      expect(groupRepository.findUnique).toHaveBeenCalledWith({ id: group.id });
      expect(s3Service.uploadFile).toHaveBeenCalledWith(file);
      expect(groupRepository.update).toHaveBeenCalledWith(group.id, {
        ...updateGroupDto,
        iconUrl: fileUrl,
      });
    });
  });

  describe('delete', () => {
    it('should delete an existing group', async () => {
      const group = { id: '1', name: 'Group 1', iconUrl: 'url.com' };

      jest.spyOn(groupRepository, 'findUnique').mockResolvedValue(group);

      await expect(service.delete(group.id)).resolves.toEqual(undefined); // don't return anything
      expect(groupRepository.findUnique).toHaveBeenCalledWith({ id: group.id });
      expect(groupRepository.delete).toHaveBeenCalledWith(group.id);
    });

    it('should throw NotFoundException if group to delete is not found', async () => {
      const group = { id: '1', name: 'Group 1', iconUrl: 'url.com' };

      jest.spyOn(groupRepository, 'findUnique').mockResolvedValue(null);

      await expect(service.delete(group.id)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });
});
