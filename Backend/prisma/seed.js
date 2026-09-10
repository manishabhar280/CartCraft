require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed products.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const products = [
  {
    name: 'Wireless Headphones', category: 'Electronics',
    description: 'Comfortable over-ear headphones with quiet focus mode for work, travel, and slow mornings.', price: 129.0, stock: 16, image: '/assets/products/wireless-headphones.svg',
  },
  {
    name: 'Smart Watch', category: 'Electronics',
    description: 'A thoughtful wrist companion for movement, messages, and keeping pace with your day.', price: 149.99, stock: 13, image: '/assets/products/smart-watch.svg',
  },
  {
    name: 'Bluetooth Speaker', category: 'Electronics',
    description: 'A compact wireless speaker with warm room-filling sound and a calm, tactile finish.', price: 79.99, stock: 24, image: '/assets/products/bluetooth-speaker.svg',
  },
  {
    name: 'Laptop Stand', category: 'Electronics',
    description: 'A stable, considered stand that lifts your screen and clears space for better work.', price: 54.5, stock: 20, image: '/assets/products/laptop-stand.svg',
  },
  {
    name: 'Classic Cotton T-Shirt', category: 'Fashion',
    description: 'A soft everyday tee with a clean shape, comfortable weight, and easy-to-wear finish.', price: 28.0, stock: 42, image: '/assets/products/classic-tshirt.svg',
  },
  {
    name: 'Denim Jacket', category: 'Fashion',
    description: 'A reliable denim layer with a relaxed fit for cool commutes and late evenings.', price: 88.0, stock: 15, image: '/assets/products/denim-jacket.svg',
  },
  {
    name: 'Everyday Sneakers', category: 'Fashion',
    description: 'Cushioned everyday sneakers designed to keep comfortable from first step to last stop.', price: 92.75, stock: 21, image: '/assets/products/sneakers.svg',
  },
  {
    name: 'Urban Backpack', category: 'Fashion',
    description: 'A durable, organized backpack with generous room for workdays, weekends, and daily essentials.', price: 74.0, stock: 19, image: '/assets/products/backpack.svg',
  },
  {
    name: 'Ceramic Vase', category: 'Home',
    description: 'A sculptural ceramic vase designed to bring a quiet focal point to shelves and tables.', price: 46.0, stock: 12, image: '/assets/products/ceramic-vase.svg',
  },
  {
    name: 'Minimal Table Lamp', category: 'Home',
    description: 'A warm table lamp with a simple silhouette for reading corners, desks, and bedside tables.', price: 64.25, stock: 11, image: '/assets/products/table-lamp.svg',
  },
  {
    name: 'Soft Cushion Set', category: 'Home',
    description: 'A pair of textured cushions that add an easy layer of comfort to sofas and reading corners.', price: 39.5, stock: 17, image: '/assets/products/cushion-set.svg',
  },
  {
    name: 'Decorative Wall Clock', category: 'Home',
    description: 'A quiet, legible wall clock that keeps the room grounded without taking it over.', price: 51.0, stock: 8, image: '/assets/products/wall-clock.svg',
  },
  {
    name: 'Stoneware Serving Bowl', category: 'Kitchen',
    description: 'A generous stoneware bowl for shared salads, seasonal fruit, and everyday table rituals.', price: 37.5, stock: 14, image: '/assets/products/serving-bowl.svg',
  },
  {
    name: 'Morning Light Pour-Over', category: 'Kitchen',
    description: 'A simple ceramic pour-over set for a slower, more satisfying cup of coffee at home.', price: 42.25, stock: 20, image: '/assets/products/pour-over.svg',
  },
  {
    name: 'Ceramic Coffee Mug', category: 'Kitchen',
    description: 'A generous ceramic mug shaped for comfortable hands and unhurried morning coffee.', price: 18.75, stock: 36, image: '/assets/products/coffee-mug.svg',
  },
  {
    name: 'Stainless Steel Lunch Box', category: 'Kitchen',
    description: 'A durable, reusable lunch box with a tidy shape for meals at work, school, or outside.', price: 26.0, stock: 28, image: '/assets/products/lunch-box.svg',
  },
  {
    name: 'Botanical Care Set', category: 'Wellness',
    description: 'A gentle daily care set with a clean botanical profile for a small reset at home.', price: 31.99, stock: 26, image: '/assets/products/botanical-care.svg',
  },
  {
    name: 'Gentle Face Wash', category: 'Wellness',
    description: 'A calm, low-foam cleanser made for a fresh daily ritual without the tight feeling.', price: 22.5, stock: 32, image: '/assets/products/face-wash.svg',
  },
  {
    name: 'Essential Oil Set', category: 'Wellness',
    description: 'A small trio of botanical scents for quiet evenings, fresh starts, and moments of calm.', price: 29.95, stock: 18, image: '/assets/products/essential-oil.svg',
  },
  {
    name: 'Classic Sunglasses', category: 'Accessories',
    description: 'A timeless pair of everyday sunglasses with comfortable frames and an easy, polished shape.', price: 44.0, stock: 23, image: '/assets/products/sunglasses.svg',
  },
  {
    name: 'Orbit Wireless Speaker', category: 'Electronics',
    description: 'A compact speaker with a smaller footprint and warm sound for desks, shelves, and bedside tables.', price: 69.99, stock: 18, image: '/assets/products/orbit-speaker.svg',
  },
  {
    name: 'Field Notes Headphones', category: 'Electronics',
    description: 'Comfortable headphones with a soft profile for focus, travel, and a quiet hour to yourself.', price: 119.0, stock: 11, image: '/assets/products/field-headphones.svg',
  },
  {
    name: 'Ridge Knit Overshirt', category: 'Fashion',
    description: 'A soft textured overshirt that layers easily from cool commutes to late evenings.', price: 68.5, stock: 18, image: '/assets/products/overshirt.svg',
  },
  {
    name: 'Everyday Canvas Tote', category: 'Fashion',
    description: 'A durable carry-all with generous room for daily essentials and a clean, considered shape.', price: 34.0, stock: 31, image: '/assets/products/canvas-tote.svg',
  },
  {
    name: 'Arc Ceramic Vase', category: 'Home',
    description: 'A compact sculptural vase designed to bring a quiet focal point to shelves and tables.', price: 46.0, stock: 12, image: '/assets/products/arc-vase.svg',
  },
  {
    name: 'Linen Cloud Throw', category: 'Home',
    description: 'A lightweight woven throw with a relaxed texture for sofas, reading corners, and guest rooms.', price: 58.75, stock: 9, image: '/assets/products/linen-throw.svg',
  },
];

const coupons = [
  { code: 'SAVE10', discountType: 'PERCENTAGE', discountValue: 10, minimumOrderAmount: 500, maximumDiscount: 500 },
  { code: 'FLAT500', discountType: 'FIXED', discountValue: 500, minimumOrderAmount: 2000 },
  { code: 'WELCOME15', discountType: 'PERCENTAGE', discountValue: 15, minimumOrderAmount: 1000, maximumDiscount: 750 },
];

async function seedProducts() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
      select: { id: true, image: true },
    });

    if (existing) {
      if (existing.image !== product.image) {
        await prisma.product.update({ where: { id: existing.id }, data: { image: product.image } });
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    await prisma.product.create({ data: product });
    created += 1;
  }

  const total = await prisma.product.count();
  console.log(`Product seed complete: ${created} created, ${updated} images updated, ${skipped} unchanged, ${total} total products.`);

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { discountType: coupon.discountType, discountValue: coupon.discountValue, minimumOrderAmount: coupon.minimumOrderAmount, maximumDiscount: coupon.maximumDiscount ?? null, isActive: true },
      create: coupon,
    });
  }
  console.log(`Coupon seed complete: ${coupons.length} development coupons available.`);

  if (process.env.ADMIN_EMAIL) {
    const admin = await prisma.user.updateMany({
      where: { email: process.env.ADMIN_EMAIL.trim().toLowerCase() },
      data: { role: 'ADMIN' },
    });
    console.log(`Admin provisioning complete: ${admin.count} user(s) promoted.`);
  }
}

seedProducts()
  .catch((error) => {
    console.error('Product seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
