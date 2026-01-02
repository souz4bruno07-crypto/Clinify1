-- CreateIndex
CREATE INDEX "appointments_user_id_start_time_status_idx" ON "appointments"("user_id", "start_time", "status");

-- CreateIndex
CREATE INDEX "appointments_staff_id_start_time_idx" ON "appointments"("staff_id", "start_time");

-- CreateIndex
CREATE INDEX "patients_user_id_name_idx" ON "patients"("user_id", "name");

-- CreateIndex
CREATE INDEX "patients_user_id_created_at_idx" ON "patients"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "transactions_user_id_date_type_idx" ON "transactions"("user_id", "date", "type");

-- CreateIndex
CREATE INDEX "transactions_user_id_category_date_idx" ON "transactions"("user_id", "category", "date");

-- CreateIndex
CREATE INDEX "users_clinic_id_role_idx" ON "users"("clinic_id", "role");

-- CreateIndex
CREATE INDEX "users_clinic_id_created_at_idx" ON "users"("clinic_id", "created_at");
