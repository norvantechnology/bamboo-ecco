import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({ allow_display_name: false, require_tld: false })
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto extends LoginDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(['owner', 'manager', 'support', 'read-only', 'customer'])
  role?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
