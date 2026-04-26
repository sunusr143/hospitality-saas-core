/*
File Name: users.controller.ts
Path: src/modules/users/users.controller.ts
*/

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { RequireModule } from '../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../common/decorators/department-access.decorator';
import { RequireAction } from '../../common/decorators/action-access.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('users')
@AllowDepartments('Administration')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @RequireAction('users.manage')
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.createUser(createUserDto, {
      role: req.user.role,
      tenantCode: req.user.tenantCode,
      isPlatformTenant: req.user.isPlatformTenant,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findAll(@Request() req, @Query() query: FindUsersDto) {
    return this.usersService.findAll(query, {
      role: req.user.role,
      tenantCode: req.user.tenantCode,
      isPlatformTenant: req.user.isPlatformTenant,
    });
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @RequireAction('users.manage')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req,
  ) {
    return this.usersService.updateStatus(
      {
        role: req.user.role,
        tenantCode: req.user.tenantCode,
        isPlatformTenant: req.user.isPlatformTenant,
      },
      id,
      dto.isActive,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequireAction('users.manage')
  async remove(@Param('id') id: string, @Request() req) {
    await this.usersService.removeUser(
      {
        role: req.user.role,
        tenantCode: req.user.tenantCode,
        isPlatformTenant: req.user.isPlatformTenant,
      },
      id,
    );
    return { success: true };
  }
}
