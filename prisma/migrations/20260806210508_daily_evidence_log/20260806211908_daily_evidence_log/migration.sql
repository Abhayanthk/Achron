-- CreateTable
CREATE TABLE "CoreItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "did" TEXT[],
    "avoided" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCardCoreState" (
    "id" TEXT NOT NULL,
    "dailyCardId" TEXT NOT NULL,
    "coreItemId" TEXT NOT NULL,
    "labelSnapshot" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DailyCardCoreState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoreItem_userId_active_sortOrder_idx" ON "CoreItem"("userId", "active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCard_userId_date_key" ON "DailyCard"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCardCoreState_dailyCardId_coreItemId_key" ON "DailyCardCoreState"("dailyCardId", "coreItemId");

-- AddForeignKey
ALTER TABLE "CoreItem" ADD CONSTRAINT "CoreItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCard" ADD CONSTRAINT "DailyCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCardCoreState" ADD CONSTRAINT "DailyCardCoreState_dailyCardId_fkey" FOREIGN KEY ("dailyCardId") REFERENCES "DailyCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCardCoreState" ADD CONSTRAINT "DailyCardCoreState_coreItemId_fkey" FOREIGN KEY ("coreItemId") REFERENCES "CoreItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
