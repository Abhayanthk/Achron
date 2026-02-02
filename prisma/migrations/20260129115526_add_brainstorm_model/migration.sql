-- CreateTable
CREATE TABLE "Brainstorm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled Brainstorm',
    "projectId" TEXT NOT NULL,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calendarEventId" TEXT,

    CONSTRAINT "Brainstorm_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Brainstorm" ADD CONSTRAINT "Brainstorm_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brainstorm" ADD CONSTRAINT "Brainstorm_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
