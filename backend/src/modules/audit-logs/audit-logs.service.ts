/*
File Name: audit-logs.service.ts
Path: src/modules/audit-logs/audit-logs.service.ts
*/

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async log(params: {
    tenantId: string;
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, any> | null;
  }) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: params.tenantId },
    });

    if (!tenant) {
      return;
    }

    const actor = params.actorId
      ? await this.userRepository.findOne({
          where: { id: params.actorId },
        })
      : null;

    const entry = this.auditRepository.create({
      tenant,
      actor: actor ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      metadata: params.metadata ?? null,
    });

    await this.auditRepository.save(entry);
  }

  async list(params: {
    tenantCode: string;
    from?: string;
    to?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
  }) {
    const qb = this.auditRepository
      .createQueryBuilder('log')
      .innerJoin('log.tenant', 'tenant')
      .leftJoinAndSelect('log.actor', 'actor')
      .where('tenant.code = :tenantCode', {
        tenantCode: params.tenantCode,
      })
      .orderBy('log.createdAt', 'DESC');

    if (params.from) {
      qb.andWhere('log.createdAt >= :from', {
        from: new Date(params.from),
      });
    }

    if (params.to) {
      qb.andWhere('log.createdAt <= :to', {
        to: new Date(params.to),
      });
    }

    if (params.action) {
      qb.andWhere('log.action = :action', { action: params.action });
    }

    if (params.entityType) {
      qb.andWhere('log.entityType = :entityType', {
        entityType: params.entityType,
      });
    }

    if (params.entityId) {
      qb.andWhere('log.entityId = :entityId', {
        entityId: params.entityId,
      });
    }

    return qb.getMany();
  }
}
