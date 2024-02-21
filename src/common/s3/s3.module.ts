import { Module } from '@nestjs/common';
import { MinioModule } from 'nestjs-minio-client';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';

@Module({
  imports: [
    ConfigModule,
    MinioModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        endPoint: configService.get<string>('MINIO_ENDPOINT')!,
        port: +configService.get<number>('MINIO_PORT')!,
        useSSL: configService.get<boolean>('MINIO_USE_SSL')!,
        accessKey: configService.get<string>('MINIO_ACCESSKEY')!,
        secretKey: configService.get<string>('MINIO_SECRETKEY')!,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [S3Service],
  controllers: [],
})
export class S3Module {}
