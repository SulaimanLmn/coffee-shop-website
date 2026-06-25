import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    name: "Espresso Origin",
    description:
      "Single-origin beans from the Ethiopian highlands, roasted medium-dark for bright berry notes and a syrupy crema.",
    price: 1200,
    imageUrl:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
    stock: 40,
  },
  {
    name: "Velvet Latte",
    description:
      "A smooth house blend steamed with microfoam milk — chocolate undertones balanced by a gentle, caramel finish.",
    price: 1500,
    imageUrl:
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
    stock: 35,
  },
  {
    name: "Classic Cappuccino",
    description:
      "Equal parts espresso, steamed milk, and dense foam. The benchmark cup, dusted with a whisper of cocoa.",
    price: 1300,
    imageUrl:
      "https://images.unsplash.com/photo-1510707577719-ae7351480136?auto=format&fit=crop&w=800&q=80",
    stock: 30,
  },
  {
    name: "Cold Brew Can",
    description:
      "Steeped for eighteen hours and canned fresh — low acidity, naturally sweet, and ready to pour over ice.",
    price: 800,
    imageUrl:
      "https://images.unsplash.com/photo-1521302080334-4bebac2763a6?auto=format&fit=crop&w=800&q=80",
    stock: 60,
  },
  {
    name: "Mocha Reserve",
    description:
      "Double espresso meeting single-origin cocoa and lightly whipped cream. Dessert in a cup, without the guilt.",
    price: 1600,
    imageUrl:
      "https://images.unsplash.com/photo-1572442388796-11668a67e63d?auto=format&fit=crop&w=800&q=80",
    stock: 25,
  },
  {
    name: "Decaf House",
    description:
      "All of the flavour, none of the buzz. Swiss-water processed for a clean, nutty cup you can sip after dark.",
    price: 1100,
    imageUrl:
      "https://images.unsplash.com/photo-1442512543430-36342c04f745?auto=format&fit=crop&w=800&q=80",
    stock: 28,
  },
];

async function main() {
  console.log("Seeding products…");
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: {},
      create: {
        id: product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        ...product,
      },
    });
  }
  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
