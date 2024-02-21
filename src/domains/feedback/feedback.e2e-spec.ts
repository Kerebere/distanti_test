import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DatabaseService } from '../../core/database';
import { FeedbackModule } from './feedback.module';

describe('FeedbackController (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FeedbackModule],
    })
      .overrideProvider(DatabaseService)
      .useValue({
        feedback: {
          create: jest.fn().mockImplementation((dto) => dto),
          findUnique: jest.fn().mockImplementation(() => null),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    databaseService = app.get<DatabaseService>(DatabaseService);
    await app.init();
  });

  it('/feedback (POST) should create feedback', () => {
    const dto = { name: 'John', lastName: 'Doe', phone: '+1234567890' };
    return request(app.getHttpServer())
      .post('/feedback')
      .send(dto)
      .expect(201)
      .then((response) => {
        expect(response.body).toEqual(dto);
      });
  });

  it('/feedback (POST) should not create feedback with existing phone number', () => {
    const dto = { name: 'John', lastName: 'Doe', phone: '+1234567890' };
    jest
      .spyOn(databaseService.feedback, 'findUnique')
      .mockResolvedValueOnce(new Promise((resolve) => resolve(dto)) as any);
    return request(app.getHttpServer())
      .post('/feedback')
      .send(dto)
      .expect(400)
      .then((response) => {
        expect(response.body.message).toContain(
          'Phone number already exists in the database',
        );
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
