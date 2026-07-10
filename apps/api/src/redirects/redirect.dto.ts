import { IsNumber, IsOptional, IsString } from 'class-validator';

export class RedirectDto {
  @IsString()
  fromPath: string;

  @IsString()
  toPath: string;

  @IsOptional()
  @IsNumber()
  statusCode?: number;
}
