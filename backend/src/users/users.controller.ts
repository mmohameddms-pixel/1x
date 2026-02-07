import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAgentDto } from './dto/create-agent.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('become-agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to become an agent' })
  async becomeAgent(@Request() req, @Body() createAgentDto: CreateAgentDto) {
    return this.usersService.createAgent(
      req.user.id,
      createAgentDto.phone,
      createAgentDto.country,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('agent-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get agent profile' })
  async getAgentProfile(@Request() req) {
    return this.usersService.getAgentProfile(req.user.id);
  }
}
