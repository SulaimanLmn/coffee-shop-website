import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
};

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const products: Omit<SeedProduct, "id">[] = [
  // Hot Coffee
  {
    name: "Espresso",
    description:
      "A double shot, rich and syrupy with a thick golden crema. The base of everything we do.",
    price: 295,
    imageUrl: img("1559056199-641a0ac8b55e"),
    stock: 200,
    category: "hot-coffee",
  },
  {
    name: "Cappuccino",
    description:
      "Equal parts espresso, steamed milk, and dense foam, dusted with a whisper of cocoa.",
    price: 450,
    imageUrl: img("1517701550927-30cf4ba1dba5"),
    stock: 200,
    category: "hot-coffee",
  },
  {
    name: "Caffè Latte",
    description:
      "Smooth espresso over microfoam-steamed milk with a velvety, milky finish.",
    price: 475,
    imageUrl: img("1587049352851-8d4e89133924"),
    stock: 200,
    category: "hot-coffee",
  },
  {
    name: "Caffè Mocha",
    description:
      "Espresso, steamed milk, and dark chocolate, finished with a swirl of whipped cream.",
    price: 525,
    imageUrl: img("1610889556528-9a770e32642f"),
    stock: 180,
    category: "hot-coffee",
  },
  {
    name: "Americano",
    description:
      "Espresso lengthened with hot water for a clean, full-bodied cup that drinks all morning.",
    price: 375,
    imageUrl: img("1442512543430-36342c04f745"),
    stock: 200,
    category: "hot-coffee",
  },
  // Iced Coffee
  {
    name: "Cold Brew",
    description:
      "Steeped for eighteen hours for a naturally sweet, low-acidity cold coffee poured over ice.",
    price: 475,
    imageUrl: img("1521302080334-4bebac2763a6"),
    stock: 120,
    category: "iced-coffee",
  },
  {
    name: "Iced Latte",
    description:
      "Espresso and cold milk over ice — refreshing, smooth, and dangerously easy to sip.",
    price: 495,
    imageUrl: img("1461023058943-07fcbe16d735"),
    stock: 120,
    category: "iced-coffee",
  },
  {
    name: "Iced Americano",
    description:
      "Espresso and cold water over ice — crisp, clean, and caffeine-forward.",
    price: 425,
    imageUrl: img("1447933601403-0c6688de566e"),
    stock: 120,
    category: "iced-coffee",
  },
  // Non-Coffee
  {
    name: "Chai Latte",
    description:
      "Spiced black tea steamed with milk and a touch of honey. Warm, fragrant, and cozy.",
    price: 500,
    imageUrl: img("1495474472287-4d71bcdd2085"),
    stock: 90,
    category: "non-coffee",
  },
  {
    name: "Hot Chocolate",
    description:
      "Rich dark chocolate steamed with milk and crowned with whipped cream.",
    price: 425,
    imageUrl: img("1485808191679-5f8ed106819e"),
    stock: 90,
    category: "non-coffee",
  },
  // Bakery
  {
    name: "Chocolate Chip Cookie",
    description:
      "Thick, chewy, and loaded with dark chocolate chunks. Baked fresh every morning.",
    price: 325,
    imageUrl: img("1499636136210-6f4ee915583e"),
    stock: 40,
    category: "bakery",
  },
  {
    name: "Butter Croissant",
    description:
      "Flaky, laminated, and golden — baked in-house and best eaten warm.",
    price: 375,
    imageUrl: img("1555507036-ab1f4038808a"),
    stock: 30,
    category: "bakery",
  },
];

async function main() {
  console.log("Seeding menu items…");
  for (const product of products) {
    const id = slugify(product.name);
    await prisma.product.upsert({
      where: { id },
      update: { ...product },
      create: { id, ...product },
    });
  }
  console.log(`Seeded ${products.length} menu items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
