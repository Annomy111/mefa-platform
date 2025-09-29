-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "country" TEXT,
    "ipaWindow" TEXT,
    "budget" TEXT,
    "duration" TEXT,
    "description" TEXT,
    "objectives" TEXT,
    "methodology" TEXT,
    "smartSpecific" TEXT,
    "smartMeasurable" TEXT,
    "smartAchievable" TEXT,
    "smartRelevant" TEXT,
    "smartTimeBound" TEXT,
    "risks" TEXT,
    "sustainability" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'template',
    "language" TEXT NOT NULL DEFAULT 'en',
    "complianceScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "relevanceScore" INTEGER,
    "maturityScore" INTEGER,
    "performanceScore" INTEGER,
    "climateContribution" REAL,
    "performanceIndicators" TEXT,
    "crossCuttingPriorities" TEXT,
    "coFinancingStructure" TEXT,
    "implementationPhase" TEXT,
    "resultIndicators" TEXT,
    "totalBudget" REAL,
    "euContribution" REAL,
    "partnerContribution" REAL,
    "leadPartner" TEXT,
    "partners" TEXT,
    "activities" TEXT,
    "deliverables" TEXT,
    "timeline" TEXT,
    "milestones" TEXT,
    "monitoringPlan" TEXT,
    "evaluationApproach" TEXT,
    "technicalSpecs" TEXT,
    "feasibilityStudy" TEXT,
    "preparatoryWork" TEXT,
    "partnerExperience" TEXT,
    "partnerRoles" TEXT,
    "mitigation" TEXT,
    "budgetBreakdown" TEXT,
    "phases" TEXT,
    "indicators" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'x-ai/grok-4-fast:free',
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIResponse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AICache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PerformanceAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "maturityScore" INTEGER NOT NULL,
    "performanceScore" INTEGER NOT NULL,
    "climateContribution" REAL NOT NULL,
    "crossCuttingPriorities" TEXT NOT NULL,
    "indicators" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "complianceStatus" TEXT NOT NULL,
    "assessmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedBy" TEXT,
    "notes" TEXT,
    CONSTRAINT "PerformanceAssessment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AIResponse_projectId_field_idx" ON "AIResponse"("projectId", "field");

-- CreateIndex
CREATE INDEX "AIResponse_createdAt_idx" ON "AIResponse"("createdAt");

-- CreateIndex
CREATE INDEX "Session_projectId_idx" ON "Session"("projectId");

-- CreateIndex
CREATE INDEX "Session_lastActive_idx" ON "Session"("lastActive");

-- CreateIndex
CREATE UNIQUE INDEX "AICache_cacheKey_key" ON "AICache"("cacheKey");

-- CreateIndex
CREATE INDEX "AICache_cacheKey_idx" ON "AICache"("cacheKey");

-- CreateIndex
CREATE INDEX "AICache_field_idx" ON "AICache"("field");

-- CreateIndex
CREATE INDEX "AICache_expiresAt_idx" ON "AICache"("expiresAt");

-- CreateIndex
CREATE INDEX "PerformanceAssessment_projectId_idx" ON "PerformanceAssessment"("projectId");

-- CreateIndex
CREATE INDEX "PerformanceAssessment_assessmentDate_idx" ON "PerformanceAssessment"("assessmentDate");

