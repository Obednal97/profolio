import { Controller, Post, Get, Body } from '@nestjs/common';
import { SetupService } from './setup.service';

export interface SetupConfigDto {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  admin: {
    email: string;
    password: string;
    name?: string;
  };
  security: {
    jwtSecret?: string;
    encryptionKey?: string;
  };
  features: {
    allowNetworkBypass: boolean;
    requireEmailVerification: boolean;
  };
  apiKeys?: {
    [provider: string]: string;
  };
}

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  async getSetupStatus() {
    return this.setupService.getSetupStatus();
  }

  @Post('initialize')
  async initializeApp(@Body() config: SetupConfigDto) {
    return this.setupService.initializeApplication(config);
  }

  @Post('test-database')
  async testDatabaseConnection(@Body() dbConfig: SetupConfigDto['database']) {
    return this.setupService.testDatabaseConnection(dbConfig);
  }

  @Get('requirements')
  async getSystemRequirements() {
    return {
      node: {
        version: '>=18.0.0',
        current: process.version
      },
      database: {
        supported: ['PostgreSQL 13+'],
        required: true
      },
      memory: {
        minimum: '512MB',
        recommended: '2GB'
      },
      storage: {
        minimum: '1GB',
        recommended: '10GB'
      }
    };
  }
} 