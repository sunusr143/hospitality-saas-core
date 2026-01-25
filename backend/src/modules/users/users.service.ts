// File Name: users.service.ts
// Path: backend/src/modules/users/users.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async createUser(dto: CreateUserDto): Promise<User> {
    const tenant = await this.tenantRepository.findOne({
      where: { code: dto.tenantCode, isActive: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found or inactive');
    }

    const user = this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      role: dto.role,
      tenant,
    });

    return this.userRepository.save(user);
  }

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
}
