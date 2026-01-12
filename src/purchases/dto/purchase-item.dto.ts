import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class PurchaseItemDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  pricePerUnit: number;
}