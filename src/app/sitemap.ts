import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/cart`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/search`, changeFrequency: "weekly", priority: 0.3 },
    { url: `${baseUrl}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/signup`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${baseUrl}/category/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const products = await prisma.product.findMany({ select: { id: true, updatedAt: true } });
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/products/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
