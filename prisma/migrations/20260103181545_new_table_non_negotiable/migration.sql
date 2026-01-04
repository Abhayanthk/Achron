-- CreateTable
CREATE TABLE "NonNegotiable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completedDates" TIMESTAMP(3)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NonNegotiable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NonNegotiable" ADD CONSTRAINT "NonNegotiable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
