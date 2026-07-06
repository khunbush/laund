-- CreateTable
CREATE TABLE "CollectionSession" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note1000" INTEGER NOT NULL DEFAULT 0,
    "note500" INTEGER NOT NULL DEFAULT 0,
    "note100" INTEGER NOT NULL DEFAULT 0,
    "note50" INTEGER NOT NULL DEFAULT 0,
    "note20" INTEGER NOT NULL DEFAULT 0,
    "coin10" INTEGER NOT NULL DEFAULT 0,
    "coin5" INTEGER NOT NULL DEFAULT 0,
    "coin2" INTEGER NOT NULL DEFAULT 0,
    "coin1" INTEGER NOT NULL DEFAULT 0,
    "totalBaht" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollectionSession_date_idx" ON "CollectionSession"("date");
