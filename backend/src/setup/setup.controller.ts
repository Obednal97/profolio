import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  HttpException, 
  HttpStatus,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { SetupService } from './setup.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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

@ApiTags('setup')
@Controller('setup')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class SetupController {

  constructor(private readonly setupService: SetupService) {}



  @Get('status')
  @ApiOperation({ summary: 'Get application setup status' })
  @ApiResponse({ status: 200, description: 'Setup status retrieved' })
  async getSetupStatus() {
    try {
      return await this.setupService.getSetupStatus();
    } catch (error) {
      throw new HttpException(
        'Failed to get setup status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize application (only available if not already set up)' })
  @ApiResponse({ status: 200, description: 'Application initialized successfully' })
  @ApiResponse({ status: 400, description: 'Invalid configuration or application already set up' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async initializeApp(@Body() config: SetupConfigDto) {
    const clientIp = 'setup-client'; // In production, extract from request
    
    try {
      // Rate limiting handled by global RateLimitMiddleware

      // Check if setup is already complete
      const status = await this.setupService.getSetupStatus();
      if (status.isSetupComplete) {
        throw new HttpException(
          'Application is already set up. Cannot reinitialize.',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate required fields
      if (!config.database || !config.admin || !config.features) {
        throw new HttpException(
          'Missing required configuration sections',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate admin credentials
      if (!config.admin.email || !config.admin.password) {
        throw new HttpException(
          'Admin email and password are required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate password strength
      if (config.admin.password.length < 8) {
        throw new HttpException(
          'Admin password must be at least 8 characters long',
          HttpStatus.BAD_REQUEST
        );
      }


      // Initialize application
      const result = await this.setupService.initializeApplication(config);
      
      if (!result.success) {
        throw new HttpException(
          result.message || 'Setup failed',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return result;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Setup initialization failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test-database')
  @ApiOperation({ summary: 'Test database connection' })
  @ApiResponse({ status: 200, description: 'Database connection test result' })
  @ApiResponse({ status: 400, description: 'Invalid database configuration' })
  async testDatabaseConnection(@Body() dbConfig: SetupConfigDto['database']) {
    try {
      // Only allow database testing if setup is not complete
      const status = await this.setupService.getSetupStatus();
      if (status.isSetupComplete) {
        throw new HttpException(
          'Database testing not available after setup completion',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!dbConfig || !dbConfig.host || !dbConfig.database) {
        throw new HttpException(
          'Invalid database configuration',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.setupService.testDatabaseConnection(dbConfig);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Database connection test failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('requirements')
  @ApiOperation({ summary: 'Get system requirements' })
  @ApiResponse({ status: 200, description: 'System requirements information' })
  async getSystemRequirements() {
    try {
      return {
        node: {
          version: '>=18.0.0',
          current: process.version,
          compatible: parseInt(process.version.slice(1).split('.')[0]) >= 18
        },
        database: {
          supported: ['PostgreSQL 13+'],
          required: true
        },
        memory: {
          minimum: '512MB',
          recommended: '2GB',
          current: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
        },
        storage: {
          minimum: '1GB',
          recommended: '10GB'
        },
        security: {
          httpsRecommended: true,
          jwtSecretRequired: true,
          passwordMinLength: 8
        }
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get system requirements',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 