import { IsDateString, IsOptional, IsEnum } from "class-validator";

export enum ReportType {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    YEARLY  = 'YEARLY',
    CUSTOM = 'CUSTOM',
}

export class ReportFilterDto {
    @IsEnum(ReportType)
    @IsOptional()
    type?: ReportType;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;
}