import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@ApiTags('withdrawals')
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private withdrawalsService: WithdrawalsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('request')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request withdrawal' })
  async requestWithdrawal(
    @Request() req,
    @Body() createWithdrawalDto: CreateWithdrawalDto,
  ) {
    return this.withdrawalsService.createWithdrawal(req.user.id, createWithdrawalDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-withdrawals')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user withdrawals' })
  async getMyWithdrawals(@Request() req) {
    return this.withdrawalsService.getUserWithdrawals(req.user.id);
  }
}
