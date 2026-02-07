/*
File Name: payments.service.ts
Path: src/modules/payments/payments.service.ts
*/

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentReconciliation } from './entities/payment-reconciliation.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { Folio } from '../billing/entities/folio.entity';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { ReconcilePaymentDto } from './dto/reconcile-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly transactionRepository: Repository<PaymentTransaction>,

    @InjectRepository(PaymentReconciliation)
    private readonly reconciliationRepository: Repository<PaymentReconciliation>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Folio)
    private readonly folioRepository: Repository<Folio>,
  ) {}

  async createTransaction(params: {
    tenantId: string;
    dto: CreatePaymentTransactionDto;
    user: { userId: string };
  }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const creator = await this.userRepository.findOne({ where: { id: user.userId } });
    if (!creator) throw new NotFoundException('User not found');

    let folio: Folio | null = null;
    if (dto.folioId) {
      folio = await this.folioRepository.findOne({ where: { id: dto.folioId, tenant: { id: tenantId } } });
      if (!folio) throw new NotFoundException('Folio not found');
    }

    const transaction = this.transactionRepository.create({
      tenant,
      createdBy: creator,
      folio,
      provider: dto.provider,
      providerReference: dto.providerReference,
      amount: dto.amount,
      currency: dto.currency,
      status: dto.status,
      metadata: dto.metadata ?? null,
    });

    return this.transactionRepository.save(transaction);
  }

  async listTransactions(tenantId: string) {
    return this.transactionRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['folio', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async reconcileTransaction(params: {
    tenantId: string;
    dto: ReconcilePaymentDto;
    user: { userId: string };
  }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const transaction = await this.transactionRepository.findOne({
      where: { id: dto.transactionId, tenant: { id: tenantId } },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const reconciler = await this.userRepository.findOne({ where: { id: user.userId } });
    if (!reconciler) throw new NotFoundException('User not found');

    const existing = await this.reconciliationRepository.findOne({
      where: { transaction: { id: transaction.id } },
    });
    if (existing) return existing;

    const reconciliation = this.reconciliationRepository.create({
      tenant,
      transaction,
      reconciledBy: reconciler,
      reconciliationReference: dto.reconciliationReference,
    });

    return this.reconciliationRepository.save(reconciliation);
  }
}
