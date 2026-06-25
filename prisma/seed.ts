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
  roastLevel: string | null;
  origin: string | null;
};

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const products: Omit<SeedProduct, "id">[] = [
  {
    name: "Espresso Origin",
    description:
      "Single-origin beans from the Ethiopian highlands, roasted medium-dark for bright berry notes and a syrupy crema. Ideal for espresso and moka pots.",
    price: 1200,
    imageUrl:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
    stock: 40,
    category: "beans",
    roastLevel: "Dark",
    origin: "Ethiopia",
  },
  {
    name: "House Blend",
    description:
      "Our signature daily-drinker — chocolate and toasted nut balanced by a clean, caramel finish. Consistent shot after shot.",
    price: 1100,
    imageUrl:
      "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=800&q=80",
    stock: 80,
    category: "beans",
    roastLevel: "Medium",
    origin: "Blend",
  },
  {
    name: "Sumatra Reserve",
    description:
      "Wet-hulled Sumatran beans with a heavy body, earthy cedar notes, and a dark-chocolate finish. Bold and unmistakable.",
    price: 1400,
    imageUrl:
      "https://images.unsplash.com/photo-1610889556528-9a770e32642f?auto=format&fit=crop&w=800&q=80",
    stock: 22,
    category: "beans",
    roastLevel: "Dark",
    origin: "Sumatra",
  },
  {
    name: "Colombia Geisha",
    description:
      "A delicate, aromatic light roast with floral jasmine, stone fruit, and a tea-like body. A standout single origin.",
    price: 2200,
    imageUrl:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80",
    stock: 14,
    category: "beans",
    roastLevel: "Light",
    origin: "Colombia",
  },
  {
    name: "Decaf House",
    description:
      "All of the flavour, none of the buzz. Swiss-water processed for a clean, nutty cup you can sip after dark.",
    price: 1100,
    imageUrl:
      "https://images.unsplash.com/photo-1442512543430-36342c04f745?auto=format&fit=crop&w=800&q=80",
    stock: 28,
    category: "beans",
    roastLevel: "Medium",
    origin: "Blend",
  },
  {
    name: "Cold Brew Can",
    description:
      "Steeped for eighteen hours and canned fresh — low acidity, naturally sweet, and ready to pour over ice.",
    price: 800,
    imageUrl:
      "https://images.unsplash.com/photo-1521302080334-4bebac2763a6?auto=format&fit=crop&w=800&q=80",
    stock: 60,
    category: "drinks",
    roastLevel: null,
    origin: null,
  },
  {
    name: "Oat Latte Carton",
    description:
      "Barista-grade oat latte in a ready-to-go carton. Smooth espresso, creamy oat, zero prep.",
    price: 950,
    imageUrl:
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
    stock: 48,
    category: "drinks",
    roastLevel: null,
    origin: null,
  },
  {
    name: "Nitro Cold Brew",
    description:
      "Infused with nitrogen for a cascading, stout-like texture and a naturally sweet, creamy head without any dairy.",
    price: 1000,
    imageUrl:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80",
    stock: 30,
    category: "drinks",
    roastLevel: null,
    origin: null,
  },
  {
    name: "Porcelain Brew Cup Set",
    description:
      "A set of two hand-glazed porcelain cups with matching saucers. Keeps heat beautifully and feels right in the hand.",
    price: 3200,
    imageUrl:
      "https://images.unsplash.com/photo-1485808191679-5f8ed106a67e?auto=format&fit=crop&w=800&q=80",
    stock: 18,
    category: "gear",
    roastLevel: null,
    origin: null,
  },
  {
    name: "Gooseneck Kettle",
    description:
      "Precision-pour gooseneck kettle with a built-in thermometer. The control you need for a balanced pour-over.",
    price: 5400,
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    stock: 12,
    category: "gear",
    roastLevel: null,
    origin: null,
  },
  {
    name: "Ceramic Burr Grinder",
    description:
      "Hand-cranked ceramic burr grinder with adjustable grind size. Quiet, consistent, and perfect for travel.",
    price: 4100,
    imageUrl:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
    stock: 9,
    category: "gear",
    roastLevel: null,
    origin: null,
  },
  {
    name: "French Press",
    description:
      "A 34 oz double-walled stainless French press that holds heat through the whole brew. Rich, full-bodied cups.",
    price: 3800,
    imageUrl:
      "https://images.unsplash.com/photo-1610889556528-9a770e32642f?auto=format&fit=crop&w=800&q=80",
    stock: 20,
    category: "gear",
    roastLevel: null,
    origin: null,
  },
];

async function main() {
  console.log("Seeding products…");
  for (const product of products) {
    const id = slugify(product.name);
    await prisma.product.upsert({
      where: { id },
      update: { ...product },
      create: { id, ...product },
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
