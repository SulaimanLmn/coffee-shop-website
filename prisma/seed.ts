import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

/** Menu photos (from Unsplash, free licence) are served by the app from public/menu/,
 * so they keep loading even if a photo is later removed from Unsplash. */
const img = (file: string) => `/menu/${file}.jpg`;

const categories = [
  { name: "Hot Coffee", slug: "hot-coffee" },
  { name: "Iced Coffee", slug: "iced-coffee" },
  { name: "Non-Coffee", slug: "non-coffee" },
  { name: "Bakery", slug: "bakery" },
  { name: "Desserts", slug: "desserts" },
];

type SeedProduct = {
  name: string;
  description: string;
  price: number; // whole IDR
  imageUrl: string;
  isAvailable: boolean;
  /** Shown in the home page promotional banner (set on first seed only). */
  isFeatured?: boolean;
  category: string;
};

const products: SeedProduct[] = [
  { name: "Espresso", description: "A double shot, rich and syrupy with a thick golden crema. The base of everything we do.", price: 18000, imageUrl: img("espresso"), isAvailable: true, category: "hot-coffee" },
  { name: "Cappuccino", description: "Equal parts espresso, steamed milk, and dense foam, dusted with a whisper of cocoa.", price: 28000, imageUrl: img("cappuccino"), isAvailable: true, category: "hot-coffee" },
  { name: "Caffè Latte", description: "Smooth espresso over microfoam-steamed milk with a velvety, milky finish.", price: 30000, imageUrl: img("caffe-latte"), isAvailable: true, isFeatured: true, category: "hot-coffee" },
  { name: "Caffè Mocha", description: "Espresso, steamed milk, and dark chocolate, finished with a swirl of whipped cream.", price: 33000, imageUrl: img("caffe-mocha"), isAvailable: true, category: "hot-coffee" },
  { name: "Americano", description: "Espresso lengthened with hot water for a clean, bold cup.", price: 24000, imageUrl: img("americano"), isAvailable: true, category: "hot-coffee" },
  { name: "Cold Brew", description: "Steeped for 18 hours and served over ice: smooth, low-acid and naturally sweet.", price: 30000, imageUrl: img("cold-brew"), isAvailable: true, isFeatured: true, category: "iced-coffee" },
  { name: "Iced Latte", description: "Chilled espresso and cold milk over ice, creamy and refreshing.", price: 32000, imageUrl: img("iced-latte"), isAvailable: true, category: "iced-coffee" },
  { name: "Iced Americano", description: "Double espresso poured over ice and cold water for a crisp, bright finish.", price: 27000, imageUrl: img("iced-americano"), isAvailable: true, category: "iced-coffee" },
  { name: "Chai Latte", description: "Spiced black tea simmered with steamed milk, warming and fragrant.", price: 31000, imageUrl: img("chai-latte"), isAvailable: true, category: "non-coffee" },
  { name: "Hot Chocolate", description: "Rich dark chocolate whisked into steamed milk, topped with foam.", price: 27000, imageUrl: img("hot-chocolate"), isAvailable: true, category: "non-coffee" },
  { name: "Chocolate Chip Cookie", description: "Baked fresh each morning: crisp edges, gooey centre, flaky sea salt.", price: 20000, imageUrl: img("chocolate-chip-cookie"), isAvailable: true, category: "bakery" },
  { name: "Butter Croissant", description: "Flaky, golden and buttery, baked in small batches throughout the day.", price: 24000, imageUrl: img("butter-croissant"), isAvailable: true, category: "bakery" },
  { name: "Tiramisu", description: "Espresso-soaked ladyfingers layered with mascarpone cream and a dusting of cocoa.", price: 35000, imageUrl: img("tiramisu"), isAvailable: true, isFeatured: true, category: "desserts" },
  { name: "New York Cheesecake", description: "Dense, creamy baked cheesecake on a buttery biscuit base, topped with a fresh berry.", price: 38000, imageUrl: img("new-york-cheesecake"), isAvailable: true, category: "desserts" },
  { name: "Fudge Brownie", description: "Rich, chewy dark-chocolate brownie with a crackly top. Lovely with an Americano.", price: 22000, imageUrl: img("fudge-brownie"), isAvailable: true, category: "desserts" },
];

async function main() {
  // Deployments seed the menu only into an empty database, so redeploying never undoes
  // the administrator's edits. The admin account always follows ADMIN_EMAIL/ADMIN_PASSWORD.
  const keepMenu = process.env.SEED_ONLY_IF_EMPTY === "1" && (await prisma.category.count()) > 0;
  if (keepMenu) {
    console.log("Database already has a menu; keeping it.");
  } else {
    await seedMenu();
  }
  await seedAdmin();
}

async function seedMenu() {
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
    const { category, isAvailable, isFeatured = false, ...data } = p;
    const categoryId = catIds.get(category)!;
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: { ...data, categoryId } }); // keeps the admin's availability and featured choices
    } else {
      await prisma.product.create({ data: { ...data, categoryId, isAvailable, isFeatured } });
    }
  }
  console.log(`Seeded ${categories.length} categories and ${products.length} menu items.`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set; no admin account created.");
    return;
  }
  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, role: "ADMIN" },
    create: { email: email.toLowerCase(), fullName: "Brew Haven Admin", passwordHash, role: "ADMIN" },
  });
  console.log(`Admin account ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
