-- RenameProductDiscountCycle
ALTER TABLE "product_discounts" RENAME TO "product_discount_cycles";

-- RenameIndex
ALTER INDEX "product_discounts_productId_startDate_endDate_idx" RENAME TO "product_discount_cycles_productId_startDate_endDate_idx";

-- RenameConstraint
ALTER TABLE "product_discount_cycles" RENAME CONSTRAINT "product_discounts_pkey" TO "product_discount_cycles_pkey";

-- RenameConstraint
ALTER TABLE "product_discount_cycles" RENAME CONSTRAINT "product_discounts_productId_fkey" TO "product_discount_cycles_productId_fkey";
