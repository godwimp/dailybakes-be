import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateSupplierDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    contact: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsNotEmpty()
    address: string;
}