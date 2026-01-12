import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { IngredientsService } from '../ingredients/ingredients.service';

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private ingredientsService: IngredientsService,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto, userId: string) {
    // Validate supplier
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: createPurchaseDto.supplierId },
    });

    if (!supplier || !supplier.isActive) {
      throw new NotFoundException('Supplier tidak ditemukan atau tidak aktif');
    }

    // Validate all ingredients exist
    for (const item of createPurchaseDto.items) {
      await this.ingredientsService.findOne(item.ingredientId);
    }

    // Calculate totals
    let totalAmount = 0;
    const items = createPurchaseDto.items.map((item) => {
      const subtotal = item.quantity * item.pricePerUnit;
      totalAmount += subtotal;
      return {
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        subtotal,
      };
    });

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber('PUR');

    // Create purchase with items in a transaction
    const purchase = await this.prisma.$transaction(async (tx) => {
      // Create purchase
      const newPurchase = await tx.purchase.create({
        data: {
          invoiceNumber,
          supplierId: createPurchaseDto.supplierId,
          userId,
          totalAmount,
          notes: createPurchaseDto.notes,
          items: {
            create: items,
          },
        },
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
          supplier: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update stock for each ingredient
      for (const item of createPurchaseDto.items) {
        await this.ingredientsService.updateStock(
          item.ingredientId,
          item.quantity,
          'add',
        );
      }

      return newPurchase;
    });

    return purchase;
  }

  async findAll(page: number = 1, limit: number = 10, startDate?: string, endDate?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [purchases, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplier: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              ingredient: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return {
      data: purchases,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Pembelian tidak ditemukan');
    }

    return purchase;
  }

  async remove(id: string) {
    const purchase = await this.findOne(id);

    // Return stock before deleting
    await this.prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        await this.ingredientsService.updateStock(
          item.ingredientId,
          Number(item.quantity),
          'subtract',
        );
      }

      await tx.purchase.delete({
        where: { id },
      });
    });

    return { message: 'Pembelian berhasil dihapus dan stok dikembalikan' };
  }

  private async generateInvoiceNumber(prefix: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const dateStr = `${year}${month}${day}`;

    // Get today's count
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.prisma.purchase.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');

    return `${prefix}/${dateStr}/${sequence}`;
  }
}