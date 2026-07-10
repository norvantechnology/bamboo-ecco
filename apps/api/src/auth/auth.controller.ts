import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto/auth.dto';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@CurrentTenantId() tenantId: string, @Body() dto: RegisterDto) {
    return this.authService.register(tenantId, dto);
  }

  @Post('login')
  login(@CurrentTenantId() tenantId: string, @Body() dto: LoginDto) {
    return this.authService.login(tenantId, dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }
}
