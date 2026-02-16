-- CreateTable
CREATE TABLE "_PatternToProblemLog" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PatternToProblemLog_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PatternToProblemLog_B_index" ON "_PatternToProblemLog"("B");

-- AddForeignKey
ALTER TABLE "_PatternToProblemLog" ADD CONSTRAINT "_PatternToProblemLog_A_fkey" FOREIGN KEY ("A") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatternToProblemLog" ADD CONSTRAINT "_PatternToProblemLog_B_fkey" FOREIGN KEY ("B") REFERENCES "ProblemLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
