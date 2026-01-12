import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from '../reports.service';
import { ReportFilterDto } from '../dto/report-filter.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles(Role.ADMIN)
  getSalesReport(@Query() filterDto: ReportFilterDto) {
    return this.reportsService.getSalesReport(filterDto);
  }

  @Get('purchases')
  @Roles(Role.ADMIN)
  getPurchasesReport(@Query() filterDto: ReportFilterDto) {
    return this.reportsService.getPurchasesReport(filterDto);
  }

  @Get('stock')
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  getStockReport() {
    return this.reportsService.getStockReport();
  }

  @Get('profit')
  @Roles(Role.ADMIN)
  getProfitReport(@Query() filterDto: ReportFilterDto) {
    return this.reportsService.getProfitReport(filterDto);
  }

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.KASIR, Role.STOCK_MASTER)
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }
}