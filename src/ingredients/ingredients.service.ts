import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async create(createIngredientDto: CreateIngredientDto) {
    const ingredient = await this.prisma.ingredient.create({
      data: createIngredientDto,
    });

    // Check if stock is below minimum
    await this.checkStockAlert(ingredient.id);

    return ingredient;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    lowStock?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    // Filter untuk stok menipis
    if (lowStock) {
      const ingredients = await this.prisma.ingredient.findMany({
        where,
      });

      const lowStockIngredients = ingredients.filter(
        (ing) => Number(ing.stockQuantity) <= Number(ing.minStock),
      );

      const paginatedData = lowStockIngredients.slice(skip, skip + limit);

      return {
        data: paginatedData,
        meta: {
          total: lowStockIngredients.length,
          page,
          limit,
          totalPages: Math.ceil(lowStockIngredients.length / limit),
        },
      };
    }

    const [ingredients, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return {
      data: ingredients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException('Bahan tidak ditemukan');
    }

    // Cek apakah stok menipis
    const isLowStock =
      Number(ingredient.stockQuantity) <= Number(ingredient.minStock);

    return {
      ...ingredient,
      isLowStock,
    };
  }

  async update(id: string, updateIngredientDto: UpdateIngredientDto) {
    await this.findOne(id);

    const ingredient = await this.prisma.ingredient.update({
      where: { id },
      data: updateIngredientDto,
    });

    // Check stock alert after update
    await this.checkStockAlert(ingredient.id);

    return ingredient;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.ingredient.delete({
      where: { id },
    });

    return { message: 'Bahan berhasil dihapus' };
  }

  async updateStock(id: string, quantity: number, type: 'add' | 'subtract') {
    const ingredient = await this.findOne(id);

    const currentStock = Number(ingredient.stockQuantity);
    const newStock =
      type === 'add' ? currentStock + quantity : currentStock - quantity;

    if (newStock < 0) {
      throw new Error('Stok tidak mencukupi');
    }

    const updated = await this.prisma.ingredient.update({
      where: { id },
      data: {
        stockQuantity: newStock,
      },
    });

    // Check stock alert
    await this.checkStockAlert(id);

    return updated;
  }

  private async checkStockAlert(ingredientId: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) return;

    const currentStock = Number(ingredient.stockQuantity);
    const minStock = Number(ingredient.minStock);

    if (currentStock <= minStock) {
      // Check if there's already an unresolved alert
      const existingAlert = await this.prisma.stockAlert.findFirst({
        where: {
          ingredientId,
          isResolved: false,
        },
      });

      if (!existingAlert) {
        await this.prisma.stockAlert.create({
          data: {
            ingredientId,
            message: `Stok ${ingredient.name} menipis! Sisa: ${currentStock} ${ingredient.unit}, Minimum: ${minStock} ${ingredient.unit}`,
          },
        });
      }
    } else {
      // Resolve alerts if stock is above minimum
      await this.prisma.stockAlert.updateMany({
        where: {
          ingredientId,
          isResolved: false,
        },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      });
    }
  }

  async getStockAlerts(resolved: boolean = false) {
    const alerts = await this.prisma.stockAlert.findMany({
      where: {
        isResolved: resolved,
      },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unit: true,
            stockQuantity: true,
            minStock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts;
  }

  async resolveStockAlert(alertId: string) {
    const alert = await this.prisma.stockAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Alert tidak ditemukan');
    }

    return this.prisma.stockAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }
}
