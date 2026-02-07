/*
File Name: channel.service.ts
Path: src/modules/channel/channel.service.ts
*/

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChannelSyncLog } from './entities/channel-sync-log.entity';
import { ChannelIntegration } from './entities/channel-integration.entity';
import { Tenant } from '../tenants/tenant.entity';
import { ChannelSyncStatus } from './enums/channel-sync-status.enum';
import { TriggerSyncDto } from './dto/trigger-sync.dto';
import { CreateChannelIntegrationDto } from './dto/create-channel-integration.dto';
import { UpdateChannelIntegrationDto } from './dto/update-channel-integration.dto';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(ChannelSyncLog)
    private readonly logRepository: Repository<ChannelSyncLog>,

    @InjectRepository(ChannelIntegration)
    private readonly integrationRepository: Repository<ChannelIntegration>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async triggerSync(tenantId: string, dto: TriggerSyncDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    const log = this.logRepository.create({
      tenant,
      channelName: dto.channelName,
      type: dto.type,
      status: ChannelSyncStatus.SUCCESS,
      payload: dto.payload ?? null,
      response: { message: 'Stub sync completed' },
      errorMessage: null,
    });

    return this.logRepository.save(log);
  }

  async listLogs(tenantId: string) {
    return this.logRepository.find({
      where: { tenant: { id: tenantId } },
      order: { createdAt: 'DESC' },
    });
  }

  async createIntegration(tenantId: string, dto: CreateChannelIntegrationDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    const existing = await this.integrationRepository.findOne({
      where: { tenant: { id: tenantId }, channelName: dto.channelName },
    });

    if (existing) {
      throw new BadRequestException('Integration already exists');
    }

    const integration = this.integrationRepository.create({
      tenant,
      channelName: dto.channelName,
      config: dto.config ?? null,
      isActive: dto.isActive ?? true,
    });

    return this.integrationRepository.save(integration);
  }

  async updateIntegration(tenantId: string, id: string, dto: UpdateChannelIntegrationDto) {
    const integration = await this.integrationRepository.findOne({
      where: { id, tenant: { id: tenantId } },
    });
    if (!integration) {
      throw new BadRequestException('Integration not found');
    }

    if (dto.channelName && dto.channelName !== integration.channelName) {
      const existing = await this.integrationRepository.findOne({
        where: { tenant: { id: tenantId }, channelName: dto.channelName },
      });
      if (existing) {
        throw new BadRequestException('Integration already exists');
      }
      integration.channelName = dto.channelName;
    }

    if (dto.config !== undefined) {
      integration.config = dto.config ?? null;
    }

    if (dto.isActive !== undefined) {
      integration.isActive = dto.isActive;
    }

    return this.integrationRepository.save(integration);
  }

  async listIntegrations(tenantId: string) {
    return this.integrationRepository.find({
      where: { tenant: { id: tenantId } },
      order: { createdAt: 'DESC' },
    });
  }
}
