import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments.service';
import { CreateVodafonePaymentDto } from '../dto/create-vodafone-payment.dto';

@Injectable()
export class VodafoneService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  async createDeposit(userId: string, createPaymentDto: CreateVodafonePaymentDto) {
    const transaction = await this.paymentsService.createTransaction(
      userId,
      'VODAFONE',
      'DEPOSIT',
      createPaymentDto.amount,
      createPaymentDto.transactionReference,
      {
        phone: createPaymentDto.phone,
        transactionReference: createPaymentDto.transactionReference,
      },
    );

    return {
      transactionId: transaction.id,
      status: 'PENDING',
      message: 'Your Vodafone Cash deposit is pending admin approval',
    };
  }

  async getPendingDeposits() {
    return this.prisma.transaction.findMany({
      where: {
        provider: 'VODAFONE',
        type: 'DEPOSIT',
        status: 'PENDING',
      },
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

  async approveDeposit(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      throw new Error('Transaction is not pending');
    }

    await this.paymentsService.updateTransactionStatus(transactionId, 'SUCCESS');

    await this.prisma.user.update({
      where: { id: transaction.userId },
      data: {
        balance: {
          increment: transaction.amount,
        },
      },
    });

    return { message: 'Deposit approved successfully' };
  }

  async rejectDeposit(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      throw new Error('Transaction is not pending');
    }

    await this.paymentsService.updateTransactionStatus(transactionId, 'FAILED');

    return { message: 'Deposit rejected' };
  }
}
