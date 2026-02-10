-- CreateEnum
CREATE TYPE "CreditEventType" AS ENUM ('EARN', 'SPEND', 'ADJUST');

-- CreateEnum
CREATE TYPE "CreditEventStatus" AS ENUM ('VALID', 'VOID', 'PENDING');

-- CreateTable
CREATE TABLE "credit_events" (
    "id" UUID NOT NULL,
    "event_uid" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "CreditEventType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CREDIT',
    "title" TEXT,
    "meta" JSONB,
    "status" "CreditEventStatus" NOT NULL DEFAULT 'VALID',
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_balances" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "earned_total" BIGINT NOT NULL DEFAULT 0,
    "spent_total" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_events_event_uid_key" ON "credit_events"("event_uid");

-- CreateIndex
CREATE INDEX "credit_events_user_id_occurred_at_idx" ON "credit_events"("user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "credit_events_user_id_ingested_at_idx" ON "credit_events"("user_id", "ingested_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "credit_balances_user_id_currency_key" ON "credit_balances"("user_id", "currency");
