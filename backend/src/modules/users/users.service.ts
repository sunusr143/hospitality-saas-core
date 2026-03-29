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
  async createUser(dto: CreateUserDto): Promise<User> {
    const tenant = await this.tenantRepository.findOne({
      where: { code: dto.tenantCode },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
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
  async findAll(query?: FindUsersDto): Promise<User[]> {
    const where = query?.tenantCode
      ? { tenant: { code: query.tenantCode } }
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

  async updateStatus(tenantCode: string, userId: string, isActive: boolean): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenant: { code: tenantCode } },
      relations: ['tenant'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = isActive;
    return this.userRepository.save(user);
  }

  async removeUser(tenantCode: string, userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenant: { code: tenantCode } },
      relations: ['tenant'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN' && user.email === 'admin@sunu.com') {
      throw new BadRequestException('Primary demo admin cannot be deleted');
    }

    await this.userRepository.remove(user);
  }
}
