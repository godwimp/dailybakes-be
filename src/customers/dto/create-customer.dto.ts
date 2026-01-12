import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max } from "class-validator";
import { MembershipType } from "@prisma/client";

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsEnum(MembershipType)
  @IsOptional()
  membershipType?: MembershipType;

  @IsDateString()
  @IsOptional()
  membershipStart?: string;

  @IsDateString()
  @IsOptional()
  membershipEnd?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount?: number;
}