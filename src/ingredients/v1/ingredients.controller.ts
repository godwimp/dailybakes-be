import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { IngredientsService } from '../ingredients.service';
import { CreateIngredientDto } from '../dto/create-ingredient.dto';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto';
import { JwtAuthGuard } from 'common/guards/jwt-auth.guard';
import { RolesGuard } from 'common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('ingredients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  create(@Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STOCK_MASTER, Role.KASIR)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.ingredientsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      lowStock === 'true',
    );
  }

  @Get('alerts')
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  getStockAlerts(@Query('resolved') resolved?: string) {
    return this.ingredientsService.getStockAlerts(resolved === 'true');
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STOCK_MASTER, Role.KASIR)
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  update(@Param('id') id: string, @Body() updateIngredientDto: UpdateIngredientDto) {
    return this.ingredientsService.update(id, updateIngredientDto);
  }

  @Patch('alerts/:id/resolve')
  @Roles(Role.ADMIN, Role.STOCK_MASTER)
  resolveAlert(@Param('id') id: string) {
    return this.ingredientsService.resolveStockAlert(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.ingredientsService.remove(id);
  }
}