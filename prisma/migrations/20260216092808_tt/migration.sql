/*
  Warnings:

  - You are about to drop the column `complexity_verified` on the `ProblemLog` table. All the data in the column will be lost.
  - You are about to drop the column `constraints_checked` on the `ProblemLog` table. All the data in the column will be lost.
  - You are about to drop the column `dry_run_done` on the `ProblemLog` table. All the data in the column will be lost.
  - You are about to drop the column `edge_cases_tested` on the `ProblemLog` table. All the data in the column will be lost.
  - You are about to drop the column `key_learning_points` on the `ProblemLog` table. All the data in the column will be lost.
  - You are about to drop the column `pattern_type` on the `ProblemLog` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `ProblemLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProblemLog" DROP COLUMN "complexity_verified",
DROP COLUMN "constraints_checked",
DROP COLUMN "dry_run_done",
DROP COLUMN "edge_cases_tested",
DROP COLUMN "key_learning_points",
DROP COLUMN "pattern_type",
DROP COLUMN "tags",
ADD COLUMN     "patternId" TEXT;

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "Pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyLearning" (
    "id" TEXT NOT NULL,
    "point" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "KeyLearning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProblemLogToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProblemLogToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_KeyLearningToProblemLog" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KeyLearningToProblemLog_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Pattern_userId_name_key" ON "Pattern"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "KeyLearning_userId_point_key" ON "KeyLearning"("userId", "point");

-- CreateIndex
CREATE INDEX "_ProblemLogToTag_B_index" ON "_ProblemLogToTag"("B");

-- CreateIndex
CREATE INDEX "_KeyLearningToProblemLog_B_index" ON "_KeyLearningToProblemLog"("B");

-- AddForeignKey
ALTER TABLE "ProblemLog" ADD CONSTRAINT "ProblemLog_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyLearning" ADD CONSTRAINT "KeyLearning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyLearning" ADD CONSTRAINT "KeyLearning_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProblemLogToTag" ADD CONSTRAINT "_ProblemLogToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ProblemLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProblemLogToTag" ADD CONSTRAINT "_ProblemLogToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KeyLearningToProblemLog" ADD CONSTRAINT "_KeyLearningToProblemLog_A_fkey" FOREIGN KEY ("A") REFERENCES "KeyLearning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KeyLearningToProblemLog" ADD CONSTRAINT "_KeyLearningToProblemLog_B_fkey" FOREIGN KEY ("B") REFERENCES "ProblemLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
