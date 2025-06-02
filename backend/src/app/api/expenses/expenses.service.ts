import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExpenseDto & { userId: string }) {
    return this.prisma.expense.create({
      data: {
        amount: dto.amount,
        category: dto.category,
        date: new Date(dto.date),
        notes: dto.notes,
        userId: dto.userId,
      },
    });
  }

  async update(id: string, dto: UpdateExpenseDto, userId: string) {
    // First verify the expense exists and belongs to the user
    const existingExpense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      throw new NotFoundException('Expense not found');
    }

    if (existingExpense.userId !== userId) {
      throw new ForbiddenException('You can only update your own expenses');
    }

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : existingExpense.date,
      },
    });
  }

  async findAllByUser(userId: string, limit = 50) {
    return this.prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async findOne(id: string, userId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.userId !== userId) {
      throw new ForbiddenException('You can only access your own expenses');
    }

    return expense;
  }

  async remove(id: string, userId: string) {
    // First verify the expense exists and belongs to the user
    const existingExpense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      throw new NotFoundException('Expense not found');
    }

    if (existingExpense.userId !== userId) {
      throw new ForbiddenException('You can only delete your own expenses');
    }

    return this.prisma.expense.delete({
      where: { id },
    });
  }

  // Keep the old findAll method for backwards compatibility if needed, but restrict to admin use
  async findAll() {
    return this.prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
  }
}