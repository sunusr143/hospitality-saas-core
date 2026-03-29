/*
File Name: channel.controller.ts
Path: src/modules/channel/channel.controller.ts
*/

import { Body, Controller, Get, Patch, Param, Post, Request, UseGuards } from '@nestjs/common';

import { ChannelService } from './channel.service';
import { TriggerSyncDto } from './dto/trigger-sync.dto';
import { CreateChannelIntegrationDto } from './dto/create-channel-integration.dto';
import { UpdateChannelIntegrationDto } from './dto/update-channel-integration.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RequireModule } from '../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../common/decorators/department-access.decorator';

@Controller('channel')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('finance')
@AllowDepartments('Finance', 'Administration')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post('sync')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async trigger(@Body() dto: TriggerSyncDto, @Request() req) {
    return this.channelService.triggerSync(req.user.tenantId, dto);
  }

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async list(@Request() req) {
    return this.channelService.listLogs(req.user.tenantId);
  }

  @Post('integrations')
  @Roles(UserRole.ADMIN)
  async createIntegration(
    @Body() dto: CreateChannelIntegrationDto,
    @Request() req,
  ) {
    return this.channelService.createIntegration(req.user.tenantId, dto);
  }

  @Patch('integrations/:id')
  @Roles(UserRole.ADMIN)
  async updateIntegration(
    @Param('id') id: string,
    @Body() dto: UpdateChannelIntegrationDto,
    @Request() req,
  ) {
    return this.channelService.updateIntegration(req.user.tenantId, id, dto);
  }

  @Get('integrations')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listIntegrations(@Request() req) {
    return this.channelService.listIntegrations(req.user.tenantId);
  }
}
