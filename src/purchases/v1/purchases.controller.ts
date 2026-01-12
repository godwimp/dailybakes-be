import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PurchasesService } from '../purchases.service';
import { CreatePurchaseDto } from '../dto/create-purchase.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  create(
    @Body() createPurchaseDto: CreatePurchaseDto,
    @CurrentUser() user: any,
  ) {
    return this.purchasesService.create(createPurchaseDto, user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.purchasesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.purchasesService.remove(id);
  }
}