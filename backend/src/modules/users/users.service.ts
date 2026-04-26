/*
File Name: users.service.ts
Path: src/modules/users/users.service.ts
*/

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { UserRole } from './enums/user-role.enum';
import { hasPlatformAccess } from '../../common/utils/platform-access';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Create a new user (ADMIN only via controller RBAC)
   */
  async createUser(
    dto: CreateUserDto,
    actor: { role: UserRole; tenantCode?: string; isPlatformTenant?: boolean },
  ): Promise<User> {
    const targetTenantCode = dto.tenantCode.toUpperCase();
    const tenant = await this.tenantRepository.findOne({
      where: { code: targetTenantCode },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    if (dto.role === UserRole.SUPER_USER && actor.role !== UserRole.SUPER_USER) {
      throw new BadRequestException('Only SUPER_USER can create another SUPER_USER');
    }

    if (!hasPlatformAccess(actor) && targetTenantCode !== String(actor.tenantCode ?? '').toUpperCase()) {
      throw new BadRequestException('You can only create users for your current hotel');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone ?? null,
      title: dto.title ?? null,
      department: dto.department ?? null,
      addressLine1: dto.addressLine1 ?? null,
      photoUrl: dto.photoUrl ?? null,
      notes: dto.notes ?? null,
      role: dto.role,
      tenant,
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  /**
   * Fetch users (optionally filtered by tenant)
   */
  async findAll(
    query?: FindUsersDto,
    actor?: { role: UserRole; tenantCode?: string; isPlatformTenant?: boolean },
  ): Promise<User[]> {
    const targetTenantCode = hasPlatformAccess(actor)
      ? query?.tenantCode?.toUpperCase()
      : String(actor?.tenantCode ?? '').toUpperCase();

    const where = targetTenantCode
      ? { tenant: { code: targetTenantCode } }
      : {};

    return this.userRepository.find({
      where,
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Used by AuthService during login
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['tenant'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });
  }

  async findActiveSuperUser(): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        role: UserRole.SUPER_USER,
        isActive: true,
      },
      relations: ['tenant'],
      order: { createdAt: 'ASC' },
    });
  }

  async configureSuperUserRecovery(params: {
    userId: string;
    questionOne: string;
    questionTwo: string;
    answerOne: string;
    answerTwo: string;
    recoveryKey: string;
  }): Promise<User> {
    const user = await this.findById(params.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.SUPER_USER) {
      throw new BadRequestException('Recovery setup is available only for SUPER_USER');
    }

    user.superUserRecoveryQuestionOne = params.questionOne.trim();
    user.superUserRecoveryQuestionTwo = params.questionTwo.trim();
    user.superUserRecoveryAnswerHashOne = await bcrypt.hash(params.answerOne, 12);
    user.superUserRecoveryAnswerHashTwo = await bcrypt.hash(params.answerTwo, 12);
    user.superUserRecoveryKeyHash = await bcrypt.hash(params.recoveryKey, 12);
    user.superUserRecoveryConfiguredAt = new Date();

    return this.userRepository.save(user);
  }

  async updatePassword(userId: string, newPassword: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    return this.userRepository.save(user);
  }

  async updateStatus(
    actor: { role: UserRole; tenantCode?: string; isPlatformTenant?: boolean },
    userId: string,
    isActive: boolean,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: hasPlatformAccess(actor)
        ? { id: userId }
        : { id: userId, tenant: { code: actor.tenantCode } },
      relations: ['tenant'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.SUPER_USER && !isActive) {
      throw new BadRequestException('SUPER_USER accounts cannot be deactivated');
    }

    user.isActive = isActive;
    return this.userRepository.save(user);
  }

  async removeUser(
    actor: { role: UserRole; tenantCode?: string; isPlatformTenant?: boolean },
    userId: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: hasPlatformAccess(actor)
        ? { id: userId }
        : { id: userId, tenant: { code: actor.tenantCode } },
      relations: ['tenant'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.SUPER_USER) {
      throw new BadRequestException('SUPER_USER accounts cannot be deleted');
    }

    if (user.role === 'ADMIN' && user.email === 'admin@sunu.com') {
      throw new BadRequestException('Primary demo admin cannot be deleted');
    }

    await this.userRepository.remove(user);
  }
}
