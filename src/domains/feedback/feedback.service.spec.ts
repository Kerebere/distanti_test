import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { HttpException } from '@nestjs/common';
import { DatabaseService } from '../../core/database';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let databaseService: jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: DatabaseService,
          useValue: {
            feedback: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    databaseService = module.get(
      DatabaseService,
    ) as jest.Mocked<DatabaseService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create feedback if phone number does not exist', async () => {
    const createFeedbackDto = {
      phone: '1234567890',
      name: 'John',
      lastName: 'Doe',
    };
    databaseService.feedback.findUnique = jest.fn().mockResolvedValue(null);
    databaseService.feedback.create = jest
      .fn()
      .mockResolvedValue(createFeedbackDto);

    await expect(service.create(createFeedbackDto)).resolves.toEqual(
      createFeedbackDto,
    );
    expect(databaseService.feedback.create).toHaveBeenCalledWith({
      data: createFeedbackDto,
    });
  });

  it('should throw an error if phone number already exists', async () => {
    const createFeedbackDto = {
      phone: '1234567890',
      name: 'John',
      lastName: 'Doe',
    };
    databaseService.feedback.findUnique = jest
      .fn()
      .mockResolvedValue(createFeedbackDto);

    await expect(service.create(createFeedbackDto)).rejects.toThrow(
      HttpException,
    );
  });
});
