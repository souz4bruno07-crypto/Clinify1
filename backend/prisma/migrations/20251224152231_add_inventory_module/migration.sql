-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('un', 'ml', 'mg', 'g', 'kg', 'cx', 'pct', 'fr', 'amp');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('entrada', 'saida', 'ajuste', 'perda', 'vencido');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('low_stock', 'expiring', 'expired', 'out_of_stock');

-- CreateTable
CREATE TABLE "inventory_products" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "barcode" TEXT,
    "sku" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Geral',
    "unit" "ProductUnit" NOT NULL DEFAULT 'un',
    "current_stock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "min_stock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "max_stock" DECIMAL(12,3),
    "cost_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sale_price" DECIMAL(12,2),
    "supplier" TEXT,
    "location" TEXT,
    "expiration_date" BIGINT,
    "batch_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "type" "MovementType" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "previous_stock" DECIMAL(12,3) NOT NULL,
    "new_stock" DECIMAL(12,3) NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "total_cost" DECIMAL(12,2),
    "reason" TEXT,
    "appointment_id" TEXT,
    "patient_name" TEXT,
    "batch_number" TEXT,
    "expiration_date" BIGINT,
    "invoice_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_procedures" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "procedure_name" TEXT NOT NULL,
    "quantity_per_use" DECIMAL(12,3) NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "product_procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "current_stock" DECIMAL(12,3) NOT NULL,
    "min_stock" DECIMAL(12,3) NOT NULL,
    "expiration_date" BIGINT,
    "days_until_expiry" INTEGER,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_products_user_id_idx" ON "inventory_products"("user_id");

-- CreateIndex
CREATE INDEX "inventory_products_barcode_idx" ON "inventory_products"("barcode");

-- CreateIndex
CREATE INDEX "inventory_products_category_idx" ON "inventory_products"("category");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_user_id_idx" ON "stock_movements"("user_id");

-- CreateIndex
CREATE INDEX "stock_movements_staff_id_idx" ON "stock_movements"("staff_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "product_procedures_product_id_idx" ON "product_procedures"("product_id");

-- CreateIndex
CREATE INDEX "product_procedures_procedure_name_idx" ON "product_procedures"("procedure_name");

-- CreateIndex
CREATE INDEX "stock_alerts_user_id_idx" ON "stock_alerts"("user_id");

-- CreateIndex
CREATE INDEX "stock_alerts_product_id_idx" ON "stock_alerts"("product_id");

-- CreateIndex
CREATE INDEX "stock_alerts_is_read_idx" ON "stock_alerts"("is_read");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_procedures" ADD CONSTRAINT "product_procedures_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
