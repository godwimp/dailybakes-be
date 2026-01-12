import { PrismaClient, Role, MembershipType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dailybakes.com' },
    update: {},
    create: {
      email: 'admin@dailybakes.com',
      password: hashedPassword,
      name: 'Admin dailybakes',
      role: Role.ADMIN,
    },
  });

  // Create Kasir User
  const kasir = await prisma.user.upsert({
    where: { email: 'kasir@dailybakes.com' },
    update: {},
    create: {
      email: 'kasir@dailybakes.com',
      password: hashedPassword,
      name: 'Kasir 1',
      role: Role.KASIR,
    },
  });

  // Create Stock Master User
  const stockMaster = await prisma.user.upsert({
    where: { email: 'stock@dailybakes.com' },
    update: {},
    create: {
      email: 'stock@dailybakes.com',
      password: hashedPassword,
      name: 'Stock Master',
      role: Role.STOCK_MASTER,
    },
  });

  // Create Sample Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'PT Tepung Nusantara',
      contact: 'Budi Santoso',
      phone: '08123456789',
      email: 'budi@tepungnusantara.com',
      address: 'Jl. Soekarno Hatta No. 111, Bandung',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'CV Gula Indonesia Sejahtera',
      contact: 'Siti Rahayu',
      phone: '08198765432',
      email: 'siti@gulaid.com',
      address: 'Jl. Turangga No. 45, Bandung',
    },
  });

  // Create Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Toko Kue Melati',
      phone: '08111222333',
      email: 'melati@tokokuue.com',
      address: 'Jl. Bunga No. 10, Bandung',
      membershipType: MembershipType.MONTHLY,
      membershipStart: new Date(),
      membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 hari
      discount: 5, // 5% discount
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Bakery Mawar',
      phone: '08222333444',
      address: 'Jl. Rose No. 20, Bandung',
      membershipType: MembershipType.NONE,
    },
  });

  // Create Sample Ingredients
  await prisma.ingredient.createMany({
    data: [
      {
        name: 'Tepung Terigu',
        description: 'Tepung terigu protein tinggi',
        unit: 'KG',
        stockQuantity: 100,
        minStock: 20,
        price: 15000,
      },
      {
        name: 'Gula Pasir',
        description: 'Gula pasir putih',
        unit: 'KG',
        stockQuantity: 50,
        minStock: 10,
        price: 18000,
      },
      {
        name: 'Mentega',
        description: 'Mentega tawar',
        unit: 'KG',
        stockQuantity: 30,
        minStock: 5,
        price: 45000,
      },
      {
        name: 'Telur',
        description: 'Telur ayam segar',
        unit: 'PCS',
        stockQuantity: 200,
        minStock: 50,
        price: 2500,
      },
      {
        name: 'Susu Cair',
        description: 'Susu full cream',
        unit: 'LITER',
        stockQuantity: 40,
        minStock: 10,
        price: 25000,
      },
    ],
  });

  console.log('✅ Seeding completed!');
  console.log('');
  console.log('📧 Default Users:');
  console.log('   Admin: admin@dailybakes.com');
  console.log('   Kasir: kasir@dailybakes.com');
  console.log('   Stock Master: stock@dailybakes.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });