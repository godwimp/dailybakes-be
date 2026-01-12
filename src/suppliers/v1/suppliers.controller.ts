import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from "@nestjs/common";
import { SuppliersService } from "../suppliers.services";
import { CreateSupplierDto } from "../dto/create-supplier.dto";
import { UpdateSupplierDto } from "../dto/update-supplier.dto";
import { JwtAuthGuard } from "common/guards/jwt-auth.guard";
import { RolesGuard } from "common/guards/roles.guard";
import { Roles } from "common/decorators/roles.decorator";
import { Role } from "@prisma/client";

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.suppliersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}