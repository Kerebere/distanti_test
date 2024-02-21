import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly bucketName: string;

  constructor(
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET')!;
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ Key: string; url: string }> {
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('Invalid file data: Buffer is empty');
    }

    const key = `${Date.now()}-${file.originalname}`;
    const metaData = {
      'Content-Type': file.mimetype,
    };

    try {
      await this.minioService.client.putObject(
        this.bucketName,
        key,
        file.buffer,
        metaData,
      );
      const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT');
      const fileUrl = `https://${minioEndpoint}/${this.bucketName}/${key}`;
      return { Key: key, url: fileUrl };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error}`);
      throw error;
    }
  }

  async getFile(key: string): Promise<{ Body: Buffer; mimeType: string }> {
    try {
      const stream = await this.minioService.client.getObject(
        this.bucketName,
        key,
      );

      const metaData = await this.minioService.client.statObject(
        this.bucketName,
        key,
      );

      const bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });

      return {
        Body: bodyBuffer,
        mimeType:
          metaData.metaData['content-type'] || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Error getting file: ${error}`, {
        key,
        bucketName: this.bucketName,
      });
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.minioService.client.removeObject(this.bucketName, key);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error}`);
      throw error;
    }
  }
}
