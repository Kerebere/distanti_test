import 'dotenv/config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { S3Service } from './s3.service';
import { MinioModule, MinioService } from 'nestjs-minio-client';
import { validationSchema } from 'src/core/environment';

describe('S3Service Integration Tests with Minio', () => {
  const testFileName = 'testfile.txt';
  const testFileContent = 'Hello, world!';

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

  const initializeServices = async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MinioModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            endPoint: configService.get<string>('MINIO_ENDPOINT')!,
            port: +configService.get<string>('MINIO_PORT')!,
            useSSL: configService.get<boolean>('MINIO_USE_SSL')!,
            accessKey: configService.get<string>('MINIO_ACCESSKEY')!,
            secretKey: configService.get<string>('MINIO_SECRETKEY')!,
          }),
          inject: [ConfigService],
        }),
        ConfigModule.forRoot({
          validationSchema,
        }),
      ],
      providers: [S3Service],
    }).compile();

    const service = module.get<S3Service>(S3Service);
    const minioService = module.get<MinioService>(MinioService);
    const configService = module.get<ConfigService>(ConfigService);

    return {
      service,
      minioService,
      testBucket: configService.get<string>('MINIO_BUCKET')!,
    };
  };

  beforeAll(async () => {
    await initializeServices();
  });

  beforeEach(async () => {
    const { minioService, testBucket } = await initializeServices();
    await minioService.client.putObject(
      testBucket,
      testFileName,
      Buffer.from(testFileContent),
    );
  });

  afterEach(async () => {
    const { minioService, testBucket } = await initializeServices();
    await minioService.client.removeObject(testBucket, testFileName);
  });

  it('should be defined', async () => {
    const { service } = await initializeServices();
    expect(service).toBeDefined();
  });

  describe('Successful operations', () => {
    it('should successfully upload a file', async () => {
      const { service } = await initializeServices();
      const file = createTestFile('upload_test.txt', 'Test upload content');
      const uploadResult = await service.uploadFile(file);
      expect(uploadResult).toBeDefined();
      expect(uploadResult.Key).toContain('upload_test.txt');
      await service.deleteFile(uploadResult.Key);
    });

    it('should successfully retrieve a file', async () => {
      const { service } = await initializeServices();
      const result = await service.getFile(testFileName);
      expect(result).toHaveProperty('Body');
      expect(result.Body?.toString()).toEqual(testFileContent);
    });

    it('should successfully delete a file', async () => {
      const { service, minioService, testBucket } = await initializeServices();
      await service.deleteFile(testFileName);
      await expect(
        minioService.client.getObject(testBucket, testFileName),
      ).rejects.toThrow();
    });

    it('should successfully upload and retrieve a binary file', async () => {
      const { service } = await initializeServices();
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
      const file = createTestFile(
        'binary_test.bin',
        binaryContent.toString(),
        'application/octet-stream',
      );
      const uploadResult = await service.uploadFile(file);
      expect(uploadResult).toBeDefined();
      const retrieveResult = await service.getFile(uploadResult.Key);
      expect(retrieveResult.Body).toEqual(binaryContent);
      await service.deleteFile(uploadResult.Key);
    });

    it('should correctly handle file name with spaces', async () => {
      const { service } = await initializeServices();
      const fileName = 'file with spaces.txt';
      const file = createTestFile(fileName, 'Content of file with spaces');
      const uploadResult = await service.uploadFile(file);
      expect(uploadResult.Key).toContain('file with spaces.txt');
      await service.deleteFile(uploadResult.Key);
    });
  });

  describe('Unsuccessful operations', () => {
    it('should reject uploading an empty buffer', async () => {
      const { service } = await initializeServices();
      const file = createTestFile('empty.txt', '');
      await expect(service.uploadFile(file)).rejects.toThrow(
        'Invalid file data: Buffer is empty',
      );
    });

    it('should handle errors during file retrieval for a non-existent file', async () => {
      const { service } = await initializeServices();
      await expect(service.getFile('non-existent-file.txt')).rejects.toThrow();
    });

    it('should handle errors during file deletion for a non-existent file', async () => {
      const { service } = await initializeServices();
      await expect(
        service.deleteFile('non-existent-file.txt'),
      ).resolves.toBeUndefined();
    });

    it('should handle file upload with invalid mimetype', async () => {
      const { service } = await initializeServices();
      const file = createTestFile(
        'invalid_mimetype.txt',
        'Invalid MIME type content',
        'application/invalid',
      );
      const uploadResult = await service.uploadFile(file);
      expect(uploadResult).toBeDefined();
      await service.deleteFile(uploadResult.Key);
    });
  });
});
