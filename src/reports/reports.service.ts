import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ReportFilterDto, ReportType } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(filterDto: ReportFilterDto) {
    const { startDate, endDate } = this.getDateRange(filterDto);

    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
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
          },
        },
      },
    });

    const totalSales = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );
    const totalDiscount = sales.reduce(
      (sum, sale) => sum + Number(sale.discount),
      0,
    );
    const totalTransactions = sales.length;

    // Group by payment method
    const paymentMethodBreakdown = sales.reduce(
      (acc, sale) => {
        const method = sale.paymentMethod;
        if (!acc[method]) {
          acc[method] = { count: 0, total: 0 };
        }
        acc[method].count += 1;
        acc[method].total += Number(sale.totalAmount);
        return acc;
      },
      {} as Record<string, { count: number; total: number }>,
    );

    // Top selling ingredients
    const ingredientSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = item.ingredientId;
        if (!ingredientSales[key]) {
          ingredientSales[key] = {
            name: item.ingredient.name,
            quantity: 0,
            revenue: 0,
          };
        }
        ingredientSales[key].quantity += Number(item.quantity);
        ingredientSales[key].revenue += Number(item.subtotal);
      });
    });

    const topIngredients = Object.values(ingredientSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalSales,
        totalDiscount,
        totalTransactions,
        averageTransaction:
          totalTransactions > 0 ? totalSales / totalTransactions : 0,
      },
      paymentMethodBreakdown,
      topIngredients,
      transactions: sales,
    };
  }

  async getPurchasesReport(filterDto: ReportFilterDto) {
    const { startDate, endDate } = this.getDateRange(filterDto);

    const purchases = await this.prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
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
          },
        },
      },
    });

    const totalPurchases = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalAmount),
      0,
    );
    const totalTransactions = purchases.length;

    // Group by supplier
    const supplierBreakdown = purchases.reduce(
      (acc, purchase) => {
        const supplierId = purchase.supplierId;
        const supplierName = purchase.supplier.name;
        if (!acc[supplierId]) {
          acc[supplierId] = {
            name: supplierName,
            count: 0,
            total: 0,
          };
        }
        acc[supplierId].count += 1;
        acc[supplierId].total += Number(purchase.totalAmount);
        return acc;
      },
      {} as Record<string, { name: string; count: number; total: number }>,
    );

    // Most purchased ingredients
    const ingredientPurchases: Record<
      string,
      { name: string; quantity: number; cost: number }
    > = {};

    purchases.forEach((purchase) => {
      purchase.items.forEach((item) => {
        const key = item.ingredientId;
        if (!ingredientPurchases[key]) {
          ingredientPurchases[key] = {
            name: item.ingredient.name,
            quantity: 0,
            cost: 0,
          };
        }
        ingredientPurchases[key].quantity += Number(item.quantity);
        ingredientPurchases[key].cost += Number(item.subtotal);
      });
    });

    const topPurchasedIngredients = Object.values(ingredientPurchases)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalPurchases,
        totalTransactions,
        averageTransaction:
          totalTransactions > 0 ? totalPurchases / totalTransactions : 0,
      },
      supplierBreakdown,
      topPurchasedIngredients,
      transactions: purchases,
    };
  }

  async getStockReport() {
    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        stockQuantity: 'asc',
      },
    });

    const totalIngredients = ingredients.length;
    const totalStockValue = ingredients.reduce(
      (sum, ing) => sum + Number(ing.stockQuantity) * Number(ing.price),
      0,
    );

    const lowStockIngredients = ingredients.filter(
      (ing) => Number(ing.stockQuantity) <= Number(ing.minStock),
    );

    const outOfStockIngredients = ingredients.filter(
      (ing) => Number(ing.stockQuantity) === 0,
    );

    return {
      summary: {
        totalIngredients,
        totalStockValue,
        lowStockCount: lowStockIngredients.length,
        outOfStockCount: outOfStockIngredients.length,
      },
      lowStockIngredients,
      outOfStockIngredients,
      allIngredients: ingredients,
    };
  }

  async getProfitReport(filterDto: ReportFilterDto) {
    const { startDate, endDate } = this.getDateRange(filterDto);

    // Get sales
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
    });

    // Get purchases
    const purchases = await this.prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );
    const totalCost = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalAmount),
      0,
    );
    const totalDiscount = sales.reduce(
      (sum, sale) => sum + Number(sale.discount),
      0,
    );

    // Calculate COGS (Cost of Goods Sold) based on purchase prices
    let cogs = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        // Get average purchase price for this ingredient
        const purchaseItems = await this.prisma.purchaseItem.findMany({
          where: {
            ingredientId: item.ingredientId,
            purchase: {
              createdAt: {
                lte: sale.createdAt,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        });

        if (purchaseItems.length > 0) {
          cogs += Number(item.quantity) * Number(purchaseItems[0].pricePerUnit);
        }
      }
    }

    const grossProfit = totalRevenue - cogs;
    const netProfit = grossProfit - totalDiscount;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalRevenue,
        totalCost,
        cogs,
        totalDiscount,
        grossProfit,
        netProfit,
        profitMargin: profitMargin.toFixed(2) + '%',
      },
    };
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's sales
    const todaySales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Today's purchases
    const todayPurchases = await this.prisma.purchase.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Stock alerts
    const stockAlerts = await this.prisma.stockAlert.findMany({
      where: {
        isResolved: false,
      },
    });

    // Low stock ingredients
    const ingredients = await this.prisma.ingredient.findMany();
    const lowStockCount = ingredients.filter(
      (ing) => Number(ing.stockQuantity) <= Number(ing.minStock),
    ).length;

    const todayRevenue = todaySales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );
    const todayPurchaseTotal = todayPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalAmount),
      0,
    );

    return {
      today: {
        salesCount: todaySales.length,
        salesRevenue: todayRevenue,
        purchasesCount: todayPurchases.length,
        purchasesTotal: todayPurchaseTotal,
      },
      inventory: {
        totalIngredients: ingredients.length,
        lowStockCount,
        activeAlertsCount: stockAlerts.length,
      },
    };
  }

  private getDateRange(filterDto: ReportFilterDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch (filterDto.type) {
      case ReportType.DAILY:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case ReportType.WEEKLY:
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case ReportType.MONTHLY:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case ReportType.YEARLY:
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case ReportType.CUSTOM:
        startDate = filterDto.startDate
          ? new Date(filterDto.startDate)
          : new Date(now.setMonth(now.getMonth() - 1));
        endDate = filterDto.endDate ? new Date(filterDto.endDate) : new Date();
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    return { startDate, endDate };
  }
}
