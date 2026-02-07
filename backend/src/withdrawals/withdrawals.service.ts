import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Injectable()
export class WithdrawalsService {
  constructor(private prisma: PrismaService) {}

  async createWithdrawal(userId: string, createWithdrawalDto: CreateWithdrawalDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.balance < createWithdrawalDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const withdrawal = await this.prisma.withdrawalRequest.create({
      data: {
        userId,
        amount: createWithdrawalDto.amount,
        method: createWithdrawalDto.method,
        phone: createWithdrawalDto.phone,
        status: 'PENDING',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          decrement: createWithdrawalDto.amount,
        },
      },
    });

    return withdrawal;
  }

  async getUserWithdrawals(userId: string) {
    return this.prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllWithdrawals() {
    return this.prisma.withdrawalRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveWithdrawal(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new BadRequestException('Withdrawal not found');
    }

    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal is not pending');
    }

    return this.prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: { status: 'APPROVED' },
    });
  }

  async rejectWithdrawal(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { user: true },
    });

    if (!withdrawal) {
      throw new BadRequestException('Withdrawal not found');
    }

    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal is not pending');
    }

    await this.prisma.user.update({
      where: { id: withdrawal.userId },
      data: {
        balance: {
          increment: withdrawal.amount,
        },
      },
    });

    return this.prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: { status: 'REJECTED' },
    });
  }
}
