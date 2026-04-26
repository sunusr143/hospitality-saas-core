// File Name: jwt.strategy.ts
// Path: backend/src/modules/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { isPlatformTenantCode } from '../../../common/utils/platform-access';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.tenant) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      isPlatformTenant: user.role === UserRole.SUPER_USER || isPlatformTenantCode(user.tenant.code),
      department: user.department,
      title: user.title,
      tenantId: user.tenant.id,
      tenantCode: user.tenant.code,
      softwareName: user.tenant.softwareName,
      enabledModules: user.tenant.enabledModules,
    };
  }
}
