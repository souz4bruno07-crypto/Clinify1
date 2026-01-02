-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'basic', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');

-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('bronze', 'silver', 'gold', 'diamond');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('discount', 'product', 'procedure', 'voucher');

-- CreateEnum
CREATE TYPE "RewardCategory" AS ENUM ('beauty', 'health', 'wellness', 'special');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('pending', 'used', 'expired');

-- CreateEnum
CREATE TYPE "PointsSource" AS ENUM ('consultation', 'procedure', 'referral', 'birthday', 'review', 'bonus');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'completed');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "mercado_pago_customer_id" TEXT,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "patient_name" TEXT NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "available_points" INTEGER NOT NULL DEFAULT 0,
    "tier" "LoyaltyTier" NOT NULL DEFAULT 'bronze',
    "total_consultations" INTEGER NOT NULL DEFAULT 0,
    "total_procedures" INTEGER NOT NULL DEFAULT 0,
    "total_referrals" INTEGER NOT NULL DEFAULT 0,
    "referral_code" TEXT NOT NULL,
    "joined_at" BIGINT NOT NULL,
    "last_activity_at" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_rewards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points_cost" INTEGER NOT NULL,
    "type" "RewardType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tier" "LoyaltyTier",
    "stock" INTEGER,
    "valid_days" INTEGER NOT NULL DEFAULT 30,
    "category" "RewardCategory" NOT NULL DEFAULT 'beauty',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_redemptions" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "reward_id" TEXT NOT NULL,
    "reward_name" TEXT NOT NULL,
    "points_spent" INTEGER NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'pending',
    "code" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "expires_at" BIGINT NOT NULL,
    "used_at" BIGINT,

    CONSTRAINT "loyalty_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_points_history" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "source" "PointsSource" NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "loyalty_points_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_referrals" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_id" TEXT,
    "referred_name" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "bonus_points" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "completed_at" BIGINT,

    CONSTRAINT "loyalty_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_members_referral_code_key" ON "loyalty_members"("referral_code");

-- CreateIndex
CREATE INDEX "loyalty_members_user_id_idx" ON "loyalty_members"("user_id");

-- CreateIndex
CREATE INDEX "loyalty_members_patient_id_idx" ON "loyalty_members"("patient_id");

-- CreateIndex
CREATE INDEX "loyalty_members_referral_code_idx" ON "loyalty_members"("referral_code");

-- CreateIndex
CREATE INDEX "loyalty_rewards_user_id_idx" ON "loyalty_rewards"("user_id");

-- CreateIndex
CREATE INDEX "loyalty_rewards_is_active_idx" ON "loyalty_rewards"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_redemptions_code_key" ON "loyalty_redemptions"("code");

-- CreateIndex
CREATE INDEX "loyalty_redemptions_member_id_idx" ON "loyalty_redemptions"("member_id");

-- CreateIndex
CREATE INDEX "loyalty_redemptions_reward_id_idx" ON "loyalty_redemptions"("reward_id");

-- CreateIndex
CREATE INDEX "loyalty_redemptions_status_idx" ON "loyalty_redemptions"("status");

-- CreateIndex
CREATE INDEX "loyalty_points_history_member_id_idx" ON "loyalty_points_history"("member_id");

-- CreateIndex
CREATE INDEX "loyalty_points_history_created_at_idx" ON "loyalty_points_history"("created_at");

-- CreateIndex
CREATE INDEX "loyalty_referrals_referrer_id_idx" ON "loyalty_referrals"("referrer_id");

-- CreateIndex
CREATE INDEX "loyalty_referrals_referred_id_idx" ON "loyalty_referrals"("referred_id");

-- CreateIndex
CREATE INDEX "loyalty_referrals_status_idx" ON "loyalty_referrals"("status");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_members" ADD CONSTRAINT "loyalty_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_rewards" ADD CONSTRAINT "loyalty_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "loyalty_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "loyalty_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_points_history" ADD CONSTRAINT "loyalty_points_history_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "loyalty_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_referrals" ADD CONSTRAINT "loyalty_referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "loyalty_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_referrals" ADD CONSTRAINT "loyalty_referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "loyalty_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
