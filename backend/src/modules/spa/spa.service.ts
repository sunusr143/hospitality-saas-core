// File Name: spa.service.ts
// Path: src/modules/spa/spa.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SpaService } from './entities/spa-service.entity';
import { SpaAppointment } from './entities/spa-appointment.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Guest } from '../guests/guest.entity';
import { User } from '../users/user.entity';
import { CreateSpaServiceDto } from './dto/create-spa-service.dto';
import { CreateSpaAppointmentDto } from './dto/create-spa-appointment.dto';
import { SpaAppointmentStatus } from './enums/spa-appointment-status.enum';

@Injectable()
export class SpaServiceManager {
  constructor(
    @InjectRepository(SpaService)
    private readonly serviceRepository: Repository<SpaService>,

    @InjectRepository(SpaAppointment)
    private readonly appointmentRepository: Repository<SpaAppointment>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createService(tenantId: string, dto: CreateSpaServiceDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const service = this.serviceRepository.create({
      tenant,
      name: dto.name,
      durationMinutes: dto.durationMinutes,
      price: dto.price,
      currency: dto.currency,
      isActive: dto.isActive ?? true,
    });

    return this.serviceRepository.save(service);
  }

  async listServices(tenantId: string) {
    return this.serviceRepository.find({
      where: { tenant: { id: tenantId } },
      order: { createdAt: 'DESC' },
    });
  }

  async bookAppointment(tenantId: string, dto: CreateSpaAppointmentDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const service = await this.serviceRepository.findOne({
      where: { id: dto.serviceId, tenant: { id: tenantId } },
    });
    if (!service) throw new NotFoundException('Service not found');

    const guest = await this.guestRepository.findOne({
      where: { id: dto.guestId, tenant: { id: tenantId } },
    });
    if (!guest) throw new NotFoundException('Guest not found');

    let staff: User | null = null;
    if (dto.staffId) {
      staff = await this.userRepository.findOne({ where: { id: dto.staffId } });
      if (!staff) throw new NotFoundException('Staff not found');
    }

    const start = new Date(dto.startAt);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    const appointment = this.appointmentRepository.create({
      tenant,
      service,
      guest,
      staff,
      startAt: start,
      endAt: end,
      status: SpaAppointmentStatus.SCHEDULED,
    });

    return this.appointmentRepository.save(appointment);
  }

  async listAppointments(tenantId: string) {
    return this.appointmentRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['service', 'guest', 'staff'],
      order: { startAt: 'DESC' },
    });
  }
}
