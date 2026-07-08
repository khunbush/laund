-- CreateTable
CREATE TABLE "MachineDay" (
    "id" TEXT NOT NULL,
    "branch" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "revenue" INTEGER NOT NULL,
    "txnCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MachineDay_date_idx" ON "MachineDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MachineDay_branch_date_key" ON "MachineDay"("branch", "date");
