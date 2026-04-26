// File Name: auth.service.ts
// Path: backend/src/modules/auth/auth.service.ts

import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { ConfigureSuperUserRecoveryDto } from './dto/configure-super-user-recovery.dto';
import { ResetSuperUserPasswordDto } from './dto/reset-super-user-password.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { isPlatformLoginCode, isPlatformTenantCode } from '../../common/utils/platform-access';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string, tenantCode: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    const normalizedTenantCode = tenantCode.trim().toUpperCase();
    const usesPlatformLogin = isPlatformLoginCode(normalizedTenantCode);
    const matchesAssignedTenant = user?.tenant.code.trim().toUpperCase() === normalizedTenantCode;
    const canUsePlatformLogin = user?.role === UserRole.SUPER_USER && usesPlatformLogin;

    if (
      !user ||
      !user.isActive ||
      (!matchesAssignedTenant && !canUsePlatformLogin)
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenant.id,
      tenantCode: user.tenant.code,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        title: user.title,
        department: user.department,
        photoUrl: user.photoUrl,
        role: user.role,
        isPlatformTenant: user.role === UserRole.SUPER_USER || isPlatformTenantCode(user.tenant.code),
        tenantId: user.tenant.id,
        tenantCode: user.tenant.code,
        softwareName: user.tenant.softwareName,
        enabledModules: user.tenant.enabledModules ?? [...Tenant.DEFAULT_ENABLED_MODULES],
      },
    };
  }

  async configureSuperUserRecovery(userId: string, dto: ConfigureSuperUserRecoveryDto) {
    const normalizedAnswerOne = this.normalizeRecoveryAnswer(dto.answerOne);
    const normalizedAnswerTwo = this.normalizeRecoveryAnswer(dto.answerTwo);

    const user = await this.usersService.configureSuperUserRecovery({
      userId,
      questionOne: dto.questionOne,
      questionTwo: dto.questionTwo,
      answerOne: normalizedAnswerOne,
      answerTwo: normalizedAnswerTwo,
      recoveryKey: dto.recoveryKey.trim(),
    });

    return {
      success: true,
      configuredAt: user.superUserRecoveryConfiguredAt,
    };
  }

  async getSuperUserRecoveryQuestions(email: string) {
    const user = await this.usersService.findByEmail(email.trim().toLowerCase());

    if (
      !user ||
      !user.isActive ||
      user.role !== UserRole.SUPER_USER ||
      !user.superUserRecoveryQuestionOne ||
      !user.superUserRecoveryQuestionTwo ||
      !user.superUserRecoveryAnswerHashOne ||
      !user.superUserRecoveryAnswerHashTwo ||
      !user.superUserRecoveryKeyHash
    ) {
      throw new UnauthorizedException('Super user recovery is not available for this account');
    }

    return {
      questionOne: user.superUserRecoveryQuestionOne,
      questionTwo: user.superUserRecoveryQuestionTwo,
    };
  }

  async resetSuperUserPassword(dto: ResetSuperUserPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email.trim().toLowerCase());

    if (
      !user ||
      !user.isActive ||
      user.role !== UserRole.SUPER_USER ||
      !user.superUserRecoveryAnswerHashOne ||
      !user.superUserRecoveryAnswerHashTwo ||
      !user.superUserRecoveryKeyHash
    ) {
      throw new UnauthorizedException('Invalid recovery credentials');
    }

    const [answerOneValid, answerTwoValid, recoveryKeyValid] = await Promise.all([
      bcrypt.compare(this.normalizeRecoveryAnswer(dto.answerOne), user.superUserRecoveryAnswerHashOne),
      bcrypt.compare(this.normalizeRecoveryAnswer(dto.answerTwo), user.superUserRecoveryAnswerHashTwo),
      bcrypt.compare(dto.recoveryKey.trim(), user.superUserRecoveryKeyHash),
    ]);

    if (!answerOneValid || !answerTwoValid || !recoveryKeyValid) {
      throw new UnauthorizedException('Invalid recovery credentials');
    }

    const sameAsCurrent = await bcrypt.compare(dto.newPassword, user.password);

    if (sameAsCurrent) {
      throw new BadRequestException('Choose a new password that is different from the current one');
    }

    await this.usersService.updatePassword(user.id, dto.newPassword);

    return {
      success: true,
      message: 'Super user password reset successful',
    };
  }

  private normalizeRecoveryAnswer(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
