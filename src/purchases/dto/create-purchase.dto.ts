import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseItemDto } from './purchase-item.dto';

export class CreatePurchaseDto {
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}