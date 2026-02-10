-- CreateTable
CREATE TABLE "user_auth" (
    "user_id" TEXT NOT NULL,
    "token_revoked_before" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_auth_pkey" PRIMARY KEY ("user_id")
);
