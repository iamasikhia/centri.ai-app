-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "calendarEventConfidence" DOUBLE PRECISION,
ADD COLUMN     "calendarEventReasoning" TEXT,
ADD COLUMN     "calendarEventType" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "htmlLink" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "meetLink" TEXT;

-- CreateTable
CREATE TABLE "UpdateItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'primary',
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "summary" TEXT,
    "senderName" TEXT,
    "senderDomain" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "frequency" TEXT NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "selectedDays" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ownerId" TEXT,
    "calendarEventId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "programName" TEXT,
    "type" TEXT NOT NULL,
    "amount" TEXT,
    "equity" TEXT,
    "description" TEXT,
    "fullDescription" TEXT,
    "logo" TEXT,
    "whatItOffers" TEXT[],
    "criteria" TEXT[],
    "stage" TEXT[],
    "location" TEXT,
    "deadline" TEXT,
    "website" TEXT,
    "tags" TEXT[],
    "aiInsight" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UpdateItem_userId_occurredAt_idx" ON "UpdateItem"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "UpdateItem_userId_category_idx" ON "UpdateItem"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "UpdateItem_userId_source_externalId_key" ON "UpdateItem"("userId", "source", "externalId");

-- CreateIndex
CREATE INDEX "Todo_userId_status_idx" ON "Todo"("userId", "status");

-- CreateIndex
CREATE INDEX "Todo_userId_dueDate_idx" ON "Todo"("userId", "dueDate");

-- AddForeignKey
ALTER TABLE "UpdateItem" ADD CONSTRAINT "UpdateItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledQuestion" ADD CONSTRAINT "ScheduledQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
