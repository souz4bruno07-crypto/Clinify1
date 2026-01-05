-- CreateTable
CREATE TABLE IF NOT EXISTS "evolution_configs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "api_url" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "instance" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evolution_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "evolution_configs_user_id_key" ON "evolution_configs"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "evolution_configs_user_id_idx" ON "evolution_configs"("user_id");

-- AddForeignKey
ALTER TABLE "evolution_configs" ADD CONSTRAINT "evolution_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
