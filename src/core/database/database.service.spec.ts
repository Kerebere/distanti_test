import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  async function createService(): Promise<DatabaseService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService],
    }).compile();

    return module.get<DatabaseService>(DatabaseService);
  }

  it('should be defined', async () => {
    const service = await createService();
    expect(service).toBeDefined();
  });
});
