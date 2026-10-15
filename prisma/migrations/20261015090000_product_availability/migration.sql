-- Replace stock tracking with an availability toggle.
ALTER TABLE "products" ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;

-- Keep existing behaviour: products that were sold out become unavailable.
UPDATE "products" SET "isAvailable" = ("stock" > 0);

ALTER TABLE "products" DROP COLUMN "stock";
