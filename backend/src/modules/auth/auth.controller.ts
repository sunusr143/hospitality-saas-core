// File Name: auth.controller.ts
// Path: backend/src/modules/auth/auth.controller.ts

import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GetSuperUserRecoveryQuestionsDto } from './dto/get-super-user-recovery-questions.dto';
import { ResetSuperUserPasswordDto } from './dto/reset-super-user-password.dto';
import { ConfigureSuperUserRecoveryDto } from './dto/configure-super-user-recovery.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(
      dto.email,
      dto.password,
      dto.tenantCode,
    );

    return this.authService.login(user);
  }

  @Post('super-user/recovery/questions')
  async getSuperUserRecoveryQuestions(@Body() dto: GetSuperUserRecoveryQuestionsDto) {
    return this.authService.getSuperUserRecoveryQuestions(dto.email);
  }

  @Post('super-user/recovery/reset')
  async resetSuperUserPassword(@Body() dto: ResetSuperUserPasswordDto) {
    return this.authService.resetSuperUserPassword(dto);
  }

  @Post('super-user/recovery/setup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_USER)
  async configureSuperUserRecovery(@Body() dto: ConfigureSuperUserRecoveryDto, @Request() req) {
    return this.authService.configureSuperUserRecovery(req.user.userId, dto);
  }
}
