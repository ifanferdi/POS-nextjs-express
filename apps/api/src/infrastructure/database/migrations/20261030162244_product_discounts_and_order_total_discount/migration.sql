-- AlterTable
ALTER TABLE "orders" DROP COLUMN "tax";

-- AlterTable
ALTER TABLE "orders" RENAME COLUMN "discount" TO "totalDiscount";

-- CreateTable
CREATE TABLE "product_discounts" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "quota" INTEGER,
    "usedQty" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMPTZ NOT NULL,
    "endDate" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "product_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_discounts_productId_startDate_endDate_idx" ON "product_discounts"("productId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "product_discounts" ADD CONSTRAINT "product_discounts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
