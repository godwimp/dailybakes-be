import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Unit } from '@prisma/client';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Unit)
  unit: Unit;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsNumber()
  @Min(0)
  minStock: number;

  @IsNumber()
  @Min(0)
  price: number;
}