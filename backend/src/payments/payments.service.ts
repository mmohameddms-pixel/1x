import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(
    userId: string,
    provider: string,
    type: string,
    amount: number,
    reference?: string,
    metadata?: any,
  ) {
    return this.prisma.transaction.create({
      data: {
        userId,
        provider: provider as any,
        type: type as any,
        amount,
        status: 'PENDING',
        reference,
        metadata,
      },
    });
  }

  async updateTransactionStatus(
    transactionId: string,
    status: string,
    metadata?: any,
  ) {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: status as any,
        metadata,
      },
    });
  }

  async getTransactionById(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async getUserTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllTransactions() {
    return this.prisma.transaction.findMany({
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
}
