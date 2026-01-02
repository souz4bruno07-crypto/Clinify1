-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('draft', 'signed', 'sent', 'cancelled');

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "patient_name" TEXT NOT NULL,
    "patient_cpf" TEXT,
    "patient_birth_date" TEXT,
    "patient_address" TEXT,
    "professional_id" TEXT NOT NULL,
    "professional_name" TEXT NOT NULL,
    "professional_crm" TEXT,
    "professional_specialty" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "diagnosis" TEXT,
    "additional_notes" TEXT,
    "template_id" TEXT,
    "signature_data" TEXT,
    "signed_at" BIGINT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'draft',
    "sent_via" JSONB DEFAULT '[]',
    "sent_at" BIGINT,
    "pdf_url" TEXT,
    "valid_until" BIGINT,
    "is_controlled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prescriptions_user_id_idx" ON "prescriptions"("user_id");

-- CreateIndex
CREATE INDEX "prescriptions_clinic_id_idx" ON "prescriptions"("clinic_id");

-- CreateIndex
CREATE INDEX "prescriptions_patient_id_idx" ON "prescriptions"("patient_id");

-- CreateIndex
CREATE INDEX "prescriptions_professional_id_idx" ON "prescriptions"("professional_id");

-- CreateIndex
CREATE INDEX "prescriptions_status_idx" ON "prescriptions"("status");

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;




