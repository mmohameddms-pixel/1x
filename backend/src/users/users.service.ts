import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        agent: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateBalance(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }

  async createAgent(userId: string, phone: string, country: string) {
    const existingAgent = await this.prisma.agent.findUnique({
      where: { userId },
    });

    if (existingAgent) {
      throw new ConflictException('Agent profile already exists');
    }

    const agent = await this.prisma.agent.create({
      data: {
        userId,
        phone,
        country,
        status: 'PENDING',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'AGENT' },
    });

    return agent;
  }

  async getAgentProfile(userId: string) {
    return this.prisma.agent.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            balance: true,
          },
        },
      },
    });
  }
}
