-- CreateTable
CREATE TABLE "MachineTxn" (
    "id" TEXT NOT NULL,
    "branch" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineTxn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MachineTxn_branch_occurredAt_idx" ON "MachineTxn"("branch", "occurredAt");
