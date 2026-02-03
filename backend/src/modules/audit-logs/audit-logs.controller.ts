/*
File Name: audit-logs.controller.ts
Path: src/modules/audit-logs/audit-logs.controller.ts
*/

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * ADMIN — list audit logs
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async list(@Query() query: AuditLogQueryDto, @Request() req) {
    return this.auditLogsService.list({
      tenantCode: req.user.tenantCode,
      from: query.from,
      to: query.to,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
    });
  }
}
