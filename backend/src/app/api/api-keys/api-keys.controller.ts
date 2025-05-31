import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  Patch,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiKeysService, CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponse } from './api-keys.service';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { ApiProvider } from '@prisma/client';
import { AuthUser } from '@/common/auth/jwt.strategy';

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  async create(@Req() req: { user: AuthUser }, @Body() createDto: CreateApiKeyDto) {
    const userId = req.user.id.toString();
    return this.apiKeysService.create(userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys for user' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async findAll(@Req() req: { user: AuthUser }) {
    const userId = req.user.id.toString();
    return this.apiKeysService.findAllByUser(userId);
  }

  @Get('provider/:provider')
  @ApiOperation({ summary: 'Get API keys by provider' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async findByProvider(@Req() req: { user: AuthUser }, @Param('provider') provider: ApiProvider) {
    const userId = req.user.id.toString();
    return this.apiKeysService.findByProvider(userId, provider);
  }

  @Post('test/:id')
  @ApiOperation({ summary: 'Test an API key' })
  @ApiResponse({ status: 200, description: 'API key test result' })
  async testConnection(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    const userId = req.user.id.toString();
    return this.apiKeysService.testConnection(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an API key' })
  @ApiResponse({ status: 200, description: 'API key updated successfully' })
  async update(@Req() req: { user: AuthUser }, @Param('id') id: string, @Body() updateDto: UpdateApiKeyDto) {
    const userId = req.user.id.toString();
    return this.apiKeysService.update(userId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API key' })
  @ApiResponse({ status: 200, description: 'API key deleted successfully' })
  async remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    const userId = req.user.id.toString();
    await this.apiKeysService.delete(userId, id);
    return { message: 'API key deleted successfully' };
  }

  @Get('providers/info')
  @ApiOperation({ summary: 'Get information about supported API providers' })
  @ApiResponse({ status: 200, description: 'Provider information retrieved' })
  async getProviderInfo(): Promise<any> {
    return {
      providers: [
        {
          id: 'ALPHA_VANTAGE',
          name: 'Alpha Vantage',
          description: 'Free stock, forex, and crypto data API',
          website: 'https://www.alphavantage.co/',
          signupUrl: 'https://www.alphavantage.co/support/#api-key',
          docs: 'https://www.alphavantage.co/documentation/',
          rateLimit: '25 requests/day (free tier)',
          supports: ['stocks', 'forex', 'crypto', 'technical indicators']
        },
        {
          id: 'COINGECKO',
          name: 'CoinGecko',
          description: 'Comprehensive cryptocurrency data API',
          website: 'https://www.coingecko.com/',
          signupUrl: 'https://www.coingecko.com/en/api/pricing',
          docs: 'https://www.coingecko.com/en/api/documentation',
          rateLimit: '30 calls/minute (free tier)',
          supports: ['crypto', 'market data', 'historical data']
        },
        {
          id: 'TWELVE_DATA',
          name: 'Twelve Data',
          description: 'Stock market data API with real-time and historical data',
          website: 'https://twelvedata.com/',
          signupUrl: 'https://twelvedata.com/pricing',
          docs: 'https://twelvedata.com/docs',
          rateLimit: '800 requests/day (free tier)',
          supports: ['stocks', 'forex', 'crypto', 'technical indicators']
        },
        {
          id: 'POLYGON_IO',
          name: 'Polygon.io',
          description: 'Real-time and historical market data',
          website: 'https://polygon.io/',
          signupUrl: 'https://polygon.io/pricing',
          docs: 'https://polygon.io/docs',
          rateLimit: '5 calls/minute (free tier)',
          supports: ['stocks', 'options', 'forex', 'crypto']
        }
      ]
    };
  }
} 