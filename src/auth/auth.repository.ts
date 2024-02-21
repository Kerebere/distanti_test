import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { ActivationToken } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthRepository {
  constructor(private databaseService: DatabaseService) {}
}
