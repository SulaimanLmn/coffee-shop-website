import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * On the deployment (Neon via Vercel) use the pooled Prisma URL, with a longer connect
 * timeout because the free database pauses when idle and takes a moment to wake up.
 * Locally POSTGRES_PRISMA_URL is unset and Prisma uses DATABASE_URL as usual.
 */
function deployedDatabaseUrl(): string | undefined {
  const raw = process.env.POSTGRES_PRISMA_URL;
  if (!raw) return undefined;
  const url = new URL(raw);
  if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "15");
  return url.toString();
}

const createPrismaClient = () =>
  new PrismaClient({
    datasourceUrl: deployedDatabaseUrl(),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
