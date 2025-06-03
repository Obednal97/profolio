import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Req,
    ValidationPipe,
    ParseUUIDPipe,
    HttpException,
    HttpStatus,
    UsePipes
  } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { AuthUser } from '@/common/auth/jwt.strategy';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateExpenseDto, @Req() req: { user: AuthUser }) {
    try {
      return await this.expensesService.create({
        ...dto,
        userId: req.user.id, // Ensure expense is tied to authenticated user
      });
    } catch (error) {
      throw new HttpException(
        'Failed to create expense',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your expense' })
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() dto: UpdateExpenseDto,
    @Req() req: { user: AuthUser }
  ) {
    try {
      return await this.expensesService.update(id, dto, req.user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to update expense',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses for authenticated user' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Req() req: { user: AuthUser }, @Query('limit') limit?: string) {
    try {
      const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50; // Max 100 items
      return await this.expensesService.findAllByUser(req.user.id, limitNum);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch expenses',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific expense' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your expense' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: AuthUser }
  ) {
    try {
      return await this.expensesService.findOne(id, req.user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch expense',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiResponse({ status: 204, description: 'Expense deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your expense' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: AuthUser }
  ) {
    try {
      await this.expensesService.remove(id, req.user.id);
      return { message: 'Expense deleted successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to delete expense',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}