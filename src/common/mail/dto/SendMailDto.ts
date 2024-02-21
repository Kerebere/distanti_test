import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMailDto {
  @IsEmail({}, { each: true })
  to: string[];

  @IsEmail({}, { each: true })
  @IsOptional()
  cc?: string[];

  @IsEmail({}, { each: true })
  @IsOptional()
  bcc?: string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body?: string;

  @IsEmail()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsEmail()
  @IsOptional()
  replyTo?: string;

  @IsString()
  @IsOptional()
  replyToName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  html?: string;
}
