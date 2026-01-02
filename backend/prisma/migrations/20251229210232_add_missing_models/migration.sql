-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'approved', 'paid');

-- CreateEnum
CREATE TYPE "PaymentReportStatus" AS ENUM ('draft', 'approved', 'paid');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('consultation', 'procedure', 'observation', 'prescription', 'referral');

-- CreateEnum
CREATE TYPE "TemplateSpecialty" AS ENUM ('general', 'dental', 'dermatology', 'cardiology', 'custom');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('xray', 'photo', 'exam', 'document', 'other');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('consent', 'anamnesis', 'treatment_plan', 'contract');

-- CreateTable
CREATE TABLE "staff_targets" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "staff_name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month_year" TEXT NOT NULL,
    "target_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "achieved_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "procedures_count" INTEGER NOT NULL DEFAULT 0,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "commission_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonus_threshold" DECIMAL(5,2),
    "bonus_rate" DECIMAL(5,2),
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "staff_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedure_commissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "procedure_name" TEXT NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commission_type" "CommissionType" NOT NULL,
    "commission_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "staff_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedure_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_records" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "staff_name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "procedure_name" TEXT NOT NULL,
    "procedure_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "commission_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonus_applied" BOOLEAN NOT NULL DEFAULT false,
    "date" BIGINT NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'pending',
    "paid_at" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_payment_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "staff_name" TEXT NOT NULL,
    "month_year" TEXT NOT NULL,
    "total_procedures" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "base_commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonus_commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_payable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PaymentReportStatus" NOT NULL DEFAULT 'draft',
    "approved_by" TEXT,
    "approved_at" BIGINT,
    "paid_at" BIGINT,
    "payment_method" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_payment_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "professional_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "attachments" TEXT[],
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_records" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "professional_id" TEXT NOT NULL,
    "professional_name" TEXT NOT NULL,
    "chief_complaint" TEXT NOT NULL,
    "clinical_exam" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "treatment_plan" TEXT NOT NULL,
    "procedures" TEXT[],
    "prescriptions" TEXT[],
    "odontogram_snapshot" JSONB,
    "signature_id" TEXT,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "consultation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odontograms" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "teeth" JSONB NOT NULL DEFAULT '[]',
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "odontograms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" "TemplateSpecialty" NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "anamnesis_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_responses" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "responses" JSONB NOT NULL DEFAULT '{}',
    "signature_id" TEXT,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "anamnesis_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_attachments" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "mime_type" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "description" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "medical_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_signatures" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "document_type" "SignatureType" NOT NULL,
    "document_id" TEXT NOT NULL,
    "signature_data" TEXT NOT NULL,
    "signed_at" BIGINT NOT NULL,
    "ip_address" TEXT,

    CONSTRAINT "digital_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_targets_user_id_idx" ON "staff_targets"("user_id");

-- CreateIndex
CREATE INDEX "staff_targets_staff_id_idx" ON "staff_targets"("staff_id");

-- CreateIndex
CREATE INDEX "staff_targets_month_year_idx" ON "staff_targets"("month_year");

-- CreateIndex
CREATE UNIQUE INDEX "staff_targets_staff_id_month_year_key" ON "staff_targets"("staff_id", "month_year");

-- CreateIndex
CREATE INDEX "procedure_commissions_user_id_idx" ON "procedure_commissions"("user_id");

-- CreateIndex
CREATE INDEX "procedure_commissions_staff_id_idx" ON "procedure_commissions"("staff_id");

-- CreateIndex
CREATE INDEX "procedure_commissions_procedure_name_idx" ON "procedure_commissions"("procedure_name");

-- CreateIndex
CREATE INDEX "commission_records_user_id_idx" ON "commission_records"("user_id");

-- CreateIndex
CREATE INDEX "commission_records_staff_id_idx" ON "commission_records"("staff_id");

-- CreateIndex
CREATE INDEX "commission_records_transaction_id_idx" ON "commission_records"("transaction_id");

-- CreateIndex
CREATE INDEX "commission_records_date_idx" ON "commission_records"("date");

-- CreateIndex
CREATE INDEX "commission_records_status_idx" ON "commission_records"("status");

-- CreateIndex
CREATE INDEX "commission_payment_reports_user_id_idx" ON "commission_payment_reports"("user_id");

-- CreateIndex
CREATE INDEX "commission_payment_reports_staff_id_idx" ON "commission_payment_reports"("staff_id");

-- CreateIndex
CREATE INDEX "commission_payment_reports_month_year_idx" ON "commission_payment_reports"("month_year");

-- CreateIndex
CREATE INDEX "commission_payment_reports_status_idx" ON "commission_payment_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "commission_payment_reports_staff_id_month_year_key" ON "commission_payment_reports"("staff_id", "month_year");

-- CreateIndex
CREATE UNIQUE INDEX "medical_records_patient_id_key" ON "medical_records"("patient_id");

-- CreateIndex
CREATE INDEX "medical_records_user_id_idx" ON "medical_records"("user_id");

-- CreateIndex
CREATE INDEX "medical_records_patient_id_idx" ON "medical_records"("patient_id");

-- CreateIndex
CREATE INDEX "clinical_notes_medical_record_id_idx" ON "clinical_notes"("medical_record_id");

-- CreateIndex
CREATE INDEX "clinical_notes_patient_id_idx" ON "clinical_notes"("patient_id");

-- CreateIndex
CREATE INDEX "clinical_notes_professional_id_idx" ON "clinical_notes"("professional_id");

-- CreateIndex
CREATE INDEX "clinical_notes_created_at_idx" ON "clinical_notes"("created_at");

-- CreateIndex
CREATE INDEX "consultation_records_medical_record_id_idx" ON "consultation_records"("medical_record_id");

-- CreateIndex
CREATE INDEX "consultation_records_patient_id_idx" ON "consultation_records"("patient_id");

-- CreateIndex
CREATE INDEX "consultation_records_professional_id_idx" ON "consultation_records"("professional_id");

-- CreateIndex
CREATE INDEX "consultation_records_appointment_id_idx" ON "consultation_records"("appointment_id");

-- CreateIndex
CREATE INDEX "consultation_records_created_at_idx" ON "consultation_records"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "odontograms_medical_record_id_key" ON "odontograms"("medical_record_id");

-- CreateIndex
CREATE INDEX "odontograms_patient_id_idx" ON "odontograms"("patient_id");

-- CreateIndex
CREATE INDEX "anamnesis_templates_user_id_idx" ON "anamnesis_templates"("user_id");

-- CreateIndex
CREATE INDEX "anamnesis_templates_specialty_idx" ON "anamnesis_templates"("specialty");

-- CreateIndex
CREATE INDEX "anamnesis_responses_medical_record_id_idx" ON "anamnesis_responses"("medical_record_id");

-- CreateIndex
CREATE INDEX "anamnesis_responses_patient_id_idx" ON "anamnesis_responses"("patient_id");

-- CreateIndex
CREATE INDEX "anamnesis_responses_template_id_idx" ON "anamnesis_responses"("template_id");

-- CreateIndex
CREATE INDEX "anamnesis_responses_created_at_idx" ON "anamnesis_responses"("created_at");

-- CreateIndex
CREATE INDEX "medical_attachments_medical_record_id_idx" ON "medical_attachments"("medical_record_id");

-- CreateIndex
CREATE INDEX "medical_attachments_patient_id_idx" ON "medical_attachments"("patient_id");

-- CreateIndex
CREATE INDEX "medical_attachments_type_idx" ON "medical_attachments"("type");

-- CreateIndex
CREATE INDEX "medical_attachments_created_at_idx" ON "medical_attachments"("created_at");

-- CreateIndex
CREATE INDEX "digital_signatures_medical_record_id_idx" ON "digital_signatures"("medical_record_id");

-- CreateIndex
CREATE INDEX "digital_signatures_patient_id_idx" ON "digital_signatures"("patient_id");

-- CreateIndex
CREATE INDEX "digital_signatures_document_id_idx" ON "digital_signatures"("document_id");

-- CreateIndex
CREATE INDEX "digital_signatures_document_type_idx" ON "digital_signatures"("document_type");

-- CreateIndex
CREATE INDEX "digital_signatures_signed_at_idx" ON "digital_signatures"("signed_at");

-- AddForeignKey
ALTER TABLE "staff_targets" ADD CONSTRAINT "staff_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedure_commissions" ADD CONSTRAINT "procedure_commissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payment_reports" ADD CONSTRAINT "commission_payment_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_records" ADD CONSTRAINT "consultation_records_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontograms" ADD CONSTRAINT "odontograms_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_templates" ADD CONSTRAINT "anamnesis_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_responses" ADD CONSTRAINT "anamnesis_responses_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_attachments" ADD CONSTRAINT "medical_attachments_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
