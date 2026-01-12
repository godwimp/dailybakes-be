import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { IngredientsService } from '../ingredients/ingredients.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private ingredientsService: IngredientsService,
  ) {}

  async create(createSaleDto: CreateSaleDto, userId: string) {
    // Validate customer if provided
    if (createSaleDto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: createSaleDto.customerId },
      });

      if (!customer || !customer.isActive) {
        throw new NotFoundException(
          'Customer tidak ditemukan atau tidak aktif',
        );
      }
    }

    // Validate ingredients and check stock
    const items: {
      ingredientId: string;
      quantity: number;
      pricePerUnit: number;
      subtotal: number;
    }[] = [];
    let subtotal = 0;

    for (const item of createSaleDto.items) {
      const ingredient = await this.ingredientsService.findOne(
        item.ingredientId,
      );

      if (Number(ingredient.stockQuantity) < item.quantity) {
        throw new BadRequestException(
          `Stok ${ingredient.name} tidak mencukupi. Tersedia: ${ingredient.stockQuantity} ${ingredient.unit}`,
        );
      }

      const pricePerUnit = Number(ingredient.price);
      const itemSubtotal = item.quantity * pricePerUnit;
      subtotal += itemSubtotal;

      items.push({
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        pricePerUnit,
        subtotal: itemSubtotal,
      });
    }

    // Calculate discount if customer has membership
    let discount = 0;
    if (createSaleDto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: createSaleDto.customerId },
      });

      if (customer && customer.membershipType !== 'NONE') {
        // Check if membership is still valid
        const now = new Date();
        if (customer.membershipEnd && customer.membershipEnd > now) {
          discount = (subtotal * Number(customer.discount)) / 100;
        }
      }
    }

    const totalAmount = subtotal - discount;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber('SAL');

    // Create sale with items in a transaction
    const sale = await this.prisma.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: createSaleDto.customerId,
          userId,
          subtotal,
          discount,
          totalAmount,
          paymentMethod: createSaleDto.paymentMethod,
          notes: createSaleDto.notes,
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
          customer: true,
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
      for (const item of createSaleDto.items) {
        await this.ingredientsService.updateStock(
          item.ingredientId,
          item.quantity,
          'subtract',
        );
      }

      return newSale;
    });

    return sale;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
    customerId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
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
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
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

    if (!sale) {
      throw new NotFoundException('Penjualan tidak ditemukan');
    }

    return sale;
  }

  async remove(id: string) {
    const sale = await this.findOne(id);

    // Return stock before deleting
    await this.prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await this.ingredientsService.updateStock(
          item.ingredientId,
          Number(item.quantity),
          'add',
        );
      }

      await tx.sale.delete({
        where: { id },
      });
    });

    return { message: 'Penjualan berhasil dihapus dan stok dikembalikan' };
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

    const count = await this.prisma.sale.count({
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
