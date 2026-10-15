import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const owner = await prisma.user.findFirst({
    where: { phone: "+917597365803" },
  });
  if (!owner) throw new Error("admin user missing — run db:seed first");

  const restaurant = await prisma.restaurant.upsert({
    where: { username: "demo-restaurant" },
    update: { selfOrderEnabled: true, isActive: true },
    create: {
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      username: "demo-restaurant",
      email: "demo@example.com",
      phone: "+911234567890",
      city: "Kochi",
      country: "IN",
      selfOrderEnabled: true,
      isActive: true,
      ownerId: owner.id,
    },
  });
  console.log("restaurant:", restaurant.id, restaurant.username);

  const table = await prisma.diningTable.upsert({
    where: {
      restaurantId_label: { restaurantId: restaurant.id, label: "T1" },
    },
    update: { isActive: true },
    create: {
      restaurantId: restaurant.id,
      label: "T1",
      seats: 4,
      section: "Main Hall",
      isActive: true,
    },
  });
  console.log("table:", table.id, table.label);

  const cat = await prisma.menuCategory.upsert({
    where: {
      restaurantId_name: { restaurantId: restaurant.id, name: "Mains" },
    },
    update: { isActive: true },
    create: {
      restaurantId: restaurant.id,
      name: "Mains",
      description: "Hearty mains",
      isActive: true,
    },
  });

  const items = [
    { name: "Butter Chicken", price: "280.00", desc: "Creamy tomato curry" },
    { name: "Masala Dosa", price: "120.00", desc: "Crisp dosa with chutneys" },
    { name: "Veg Biryani", price: "180.00", desc: "Fragrant basmati biryani" },
  ];
  for (const [i, it] of items.entries()) {
    await prisma.menuItem.upsert({
      where: { id: `demo-item-${i}` },
      update: { isActive: true, price: it.price },
      create: {
        id: `demo-item-${i}`,
        restaurantId: restaurant.id,
        categoryId: cat.id,
        name: it.name,
        shortDescription: it.desc,
        price: it.price,
        isActive: true,
      },
    });
  }
  console.log("menu items seeded");
  console.log(`GUEST_URL=/order/demo-restaurant?table=${table.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
