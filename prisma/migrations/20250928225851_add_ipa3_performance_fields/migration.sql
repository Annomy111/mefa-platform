-- AlterTable
ALTER TABLE "Project" ADD COLUMN "activities" TEXT;
ALTER TABLE "Project" ADD COLUMN "budgetBreakdown" TEXT;
ALTER TABLE "Project" ADD COLUMN "climateContribution" REAL;
ALTER TABLE "Project" ADD COLUMN "coFinancingStructure" TEXT;
ALTER TABLE "Project" ADD COLUMN "crossCuttingPriorities" TEXT;
ALTER TABLE "Project" ADD COLUMN "deliverables" TEXT;
ALTER TABLE "Project" ADD COLUMN "euContribution" REAL;
ALTER TABLE "Project" ADD COLUMN "evaluationApproach" TEXT;
ALTER TABLE "Project" ADD COLUMN "feasibilityStudy" TEXT;
ALTER TABLE "Project" ADD COLUMN "implementationPhase" TEXT;
ALTER TABLE "Project" ADD COLUMN "indicators" TEXT;
ALTER TABLE "Project" ADD COLUMN "leadPartner" TEXT;
ALTER TABLE "Project" ADD COLUMN "maturityScore" INTEGER;
ALTER TABLE "Project" ADD COLUMN "milestones" TEXT;
ALTER TABLE "Project" ADD COLUMN "mitigation" TEXT;
ALTER TABLE "Project" ADD COLUMN "monitoringPlan" TEXT;
ALTER TABLE "Project" ADD COLUMN "partnerContribution" REAL;
ALTER TABLE "Project" ADD COLUMN "partnerExperience" TEXT;
ALTER TABLE "Project" ADD COLUMN "partnerRoles" TEXT;
ALTER TABLE "Project" ADD COLUMN "partners" TEXT;
ALTER TABLE "Project" ADD COLUMN "performanceIndicators" TEXT;
ALTER TABLE "Project" ADD COLUMN "performanceScore" INTEGER;
ALTER TABLE "Project" ADD COLUMN "phases" TEXT;
ALTER TABLE "Project" ADD COLUMN "preparatoryWork" TEXT;
ALTER TABLE "Project" ADD COLUMN "relevanceScore" INTEGER;
ALTER TABLE "Project" ADD COLUMN "resultIndicators" TEXT;
ALTER TABLE "Project" ADD COLUMN "technicalSpecs" TEXT;
ALTER TABLE "Project" ADD COLUMN "timeline" TEXT;
ALTER TABLE "Project" ADD COLUMN "totalBudget" REAL;

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
CREATE INDEX "PerformanceAssessment_projectId_idx" ON "PerformanceAssessment"("projectId");

-- CreateIndex
CREATE INDEX "PerformanceAssessment_assessmentDate_idx" ON "PerformanceAssessment"("assessmentDate");
