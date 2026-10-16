/**
 * CI smoke-test fixture: a minimal demo restaurant (table + menu + staff)
 * so the boot smoke test can render the guest and staff flows against a
 * real database. Idempotent — safe to run on every CI build.
 *
 * Usage: `npx tsx scripts/ci-smoke-seed.ts` (DATABASE_URL must be set).
 * Prints `SMOKE_TABLE_ID=<id>` for the workflow to curl.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { hashStaffPin } from "../src/lib/staff-pin";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main(): Promise<void> {
  const owner = await prisma.user.upsert({
    where: { phone: "+910000000001" },
    update: {},
    create: { phone: "+910000000001", name: "Smoke Owner", role: "ADMIN" },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { username: "demo-restaurant" },
    update: { selfOrderEnabled: true, isActive: true },
    create: {
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      username: "demo-restaurant",
      selfOrderEnabled: true,
      upiId: "demo@okhdfc",
      ownerId: owner.id,
    },
  });

  const table = await prisma.diningTable.upsert({
    where: {
      restaurantId_label: { restaurantId: restaurant.id, label: "T1" },
    },
    update: { isActive: true, deletedAt: null },
    create: { restaurantId: restaurant.id, label: "T1", seats: 4 },
  });

  const category = await prisma.menuCategory.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Mains" } },
    update: {},
    create: { restaurantId: restaurant.id, name: "Mains" },
  });

  await prisma.menuItem.upsert({
    where: { id: "smoke-item-1" },
    update: { isActive: true, deletedAt: null },
    create: {
      id: "smoke-item-1",
      restaurantId: restaurant.id,
      categoryId: category.id,
      name: "Smoke Thali",
      price: 199,
    },
  });

  await prisma.staff.upsert({
    where: {
      restaurantId_employeeCode: {
        restaurantId: restaurant.id,
        employeeCode: "EMP001",
      },
    },
    update: { status: "ACTIVE", deletedAt: null },
    create: {
      restaurantId: restaurant.id,
      employeeCode: "EMP001",
      name: "Smoke Waiter",
      role: "WAITER",
      phone: "+910000000002",
      pinHash: hashStaffPin("1111", restaurant.id),
    },
  });

  console.log(`SMOKE_TABLE_ID=${table.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
