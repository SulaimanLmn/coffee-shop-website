import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const categories = [
  { name: "Hot Coffee", slug: "hot-coffee" },
  { name: "Iced Coffee", slug: "iced-coffee" },
  { name: "Non-Coffee", slug: "non-coffee" },
  { name: "Bakery", slug: "bakery" },
];

type SeedProduct = {
  name: string;
  description: string;
  price: number; // whole IDR
  imageUrl: string;
  isAvailable: boolean;
  category: string;
};

const products: SeedProduct[] = [
  { name: "Espresso", description: "A double shot, rich and syrupy with a thick golden crema. The base of everything we do.", price: 18000, imageUrl: img("1559056199-641a0ac8b55e"), isAvailable: true, category: "hot-coffee" },
  { name: "Cappuccino", description: "Equal parts espresso, steamed milk, and dense foam, dusted with a whisper of cocoa.", price: 28000, imageUrl: img("1517701550927-30cf4ba1dba5"), isAvailable: true, category: "hot-coffee" },
  { name: "Caffè Latte", description: "Smooth espresso over microfoam-steamed milk with a velvety, milky finish.", price: 30000, imageUrl: img("1587049352851-8d4e89133924"), isAvailable: true, category: "hot-coffee" },
  { name: "Caffè Mocha", description: "Espresso, steamed milk, and dark chocolate, finished with a swirl of whipped cream.", price: 33000, imageUrl: img("1610889556528-9a770e32642f"), isAvailable: true, category: "hot-coffee" },
  { name: "Americano", description: "Espresso lengthened with hot water for a clean, bold cup.", price: 24000, imageUrl: img("1442512543430-36342c04f745"), isAvailable: true, category: "hot-coffee" },
  { name: "Cold Brew", description: "Steeped for 18 hours and served over ice: smooth, low-acid and naturally sweet.", price: 30000, imageUrl: img("1521302080334-4bebac2763a6"), isAvailable: true, category: "iced-coffee" },
  { name: "Iced Latte", description: "Chilled espresso and cold milk over ice, creamy and refreshing.", price: 32000, imageUrl: img("1461023058943-07fcbe16d735"), isAvailable: true, category: "iced-coffee" },
  { name: "Iced Americano", description: "Double espresso poured over ice and cold water for a crisp, bright finish.", price: 27000, imageUrl: img("1447933601403-0c6688de566e"), isAvailable: true, category: "iced-coffee" },
  { name: "Chai Latte", description: "Spiced black tea simmered with steamed milk, warming and fragrant.", price: 31000, imageUrl: img("1495474472287-4d71bcdd2085"), isAvailable: true, category: "non-coffee" },
  { name: "Hot Chocolate", description: "Rich dark chocolate whisked into steamed milk, topped with foam.", price: 27000, imageUrl: img("1485808191679-5f8ed106819e"), isAvailable: true, category: "non-coffee" },
  { name: "Chocolate Chip Cookie", description: "Baked fresh each morning: crisp edges, gooey centre, flaky sea salt.", price: 20000, imageUrl: img("1499636136210-6f4ee915583e"), isAvailable: true, category: "bakery" },
  { name: "Butter Croissant", description: "Flaky, golden and buttery, baked in small batches throughout the day.", price: 24000, imageUrl: img("1555507036-ab1f4038808a"), isAvailable: true, category: "bakery" },
];

async function main() {
  console.log("Seeding categories…");
  const catIds = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
    catIds.set(c.slug, row.id);
  }

  console.log("Seeding menu items…");
  for (const p of products) {
    const { category, isAvailable, ...data } = p;
    const categoryId = catIds.get(category)!;
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: { ...data, categoryId } }); // keeps the admin's availability choice
    } else {
      await prisma.product.create({ data: { ...data, categoryId, isAvailable } });
    }
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await hashPassword(password);
    await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { passwordHash, role: "ADMIN" },
      create: { email: email.toLowerCase(), fullName: "Brew Haven Admin", passwordHash, role: "ADMIN" },
    });
    console.log(`Admin account ready: ${email}`);
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set; no admin account created.");
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} menu items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
