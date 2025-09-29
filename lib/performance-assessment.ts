/**
 * IPA III Performance Assessment Module
 * Based on Regulation (EU) 2021/1529 and official IPA III criteria
 * Evaluates projects on RELEVANCE and MATURITY for performance-based funding
 */

import { Project } from '@prisma/client'

export interface PerformanceIndicator {
  id: string
  category: 'output' | 'result' | 'impact'
  description: string
  target: number | string
  baseline: number | string
  current?: number | string
  unit: string
  verification: string
}

export interface CrossCuttingPriority {
  genderEquality: number // 0-100
  environmentalProtection: number // 0-100
  climateAction: number // 0-100
  digitalTransformation: number // 0-100
  goodGovernance: number // 0-100
  youthInclusion: number // 0-100
}

export interface PerformanceAssessment {
  relevanceScore: number // 0-100
  maturityScore: number // 0-100
  performanceScore: number // Combined weighted score
  climateContribution: number // Percentage of budget
  crossCuttingPriorities: CrossCuttingPriority
  indicators: PerformanceIndicator[]
  recommendations: string[]
  compliance: {
    meetsRelevanceCriteria: boolean
    meetsMaturityCriteria: boolean
    meetsClimateTarget: boolean
    overallCompliant: boolean
  }
}

/**
 * Calculate RELEVANCE score based on IPA III strategic priorities
 * Evaluates alignment with EU acquis, national strategies, and regional priorities
 */
export function calculateRelevanceScore(project: any): number {
  let score = 0
  const weights = {
    strategicAlignment: 0.25,
    euAcquisAlignment: 0.20,
    nationalPriorities: 0.15,
    regionalCooperation: 0.15,
    innovationPotential: 0.10,
    sustainabilityImpact: 0.15
  }

  // Strategic Alignment with IPA III Windows
  const windowAlignmentScores: Record<string, number> = {
    window1: project.objectives?.includes('rule of law') ||
             project.objectives?.includes('judicial') ||
             project.objectives?.includes('corruption') ? 90 : 60,
    window2: project.objectives?.includes('governance') ||
             project.objectives?.includes('democracy') ||
             project.objectives?.includes('civil society') ? 90 : 60,
    window3: project.objectives?.includes('green') ||
             project.objectives?.includes('climate') ||
             project.objectives?.includes('sustainable') ||
             project.objectives?.includes('environment') ? 95 : 65,
    window4: project.objectives?.includes('digital') ||
             project.objectives?.includes('innovation') ||
             project.objectives?.includes('competitiveness') ? 90 : 60,
    window5: project.objectives?.includes('cross-border') ||
             project.objectives?.includes('territorial') ||
             project.objectives?.includes('cooperation') ? 85 : 60
  }

  const windowScore = windowAlignmentScores[project.ipaWindow] || 50
  score += windowScore * weights.strategicAlignment

  // EU Acquis Alignment
  const acquisChapters = [
    'judiciary', 'anti-corruption', 'public procurement', 'statistics',
    'financial control', 'economic criteria', 'public administration',
    'transport', 'energy', 'environment', 'climate', 'digital',
    'competitiveness', 'social policy', 'education', 'culture'
  ]

  const matchedChapters = acquisChapters.filter(chapter =>
    project.objectives?.toLowerCase().includes(chapter) ||
    project.description?.toLowerCase().includes(chapter)
  ).length

  const acquisScore = Math.min(100, (matchedChapters / acquisChapters.length) * 200)
  score += acquisScore * weights.euAcquisAlignment

  // National Priority Alignment
  const nationalPriorityKeywords = [
    'national strategy', 'government priority', 'national development',
    'country strategy', 'national action plan', 'sectoral strategy'
  ]

  const nationalAlignment = nationalPriorityKeywords.some(keyword =>
    project.description?.toLowerCase().includes(keyword)
  ) ? 85 : 55
  score += nationalAlignment * weights.nationalPriorities

  // Regional Cooperation Potential
  const regionalIndicators = [
    'regional', 'cross-border', 'multi-country', 'Western Balkans',
    'neighboring', 'transnational', 'interregional'
  ]

  const regionalMatches = regionalIndicators.filter(indicator =>
    project.description?.toLowerCase().includes(indicator.toLowerCase())
  ).length

  const regionalScore = Math.min(100, 50 + (regionalMatches * 10))
  score += regionalScore * weights.regionalCooperation

  // Innovation Potential
  const innovationKeywords = [
    'innovative', 'pilot', 'first', 'novel', 'cutting-edge',
    'state-of-the-art', 'transformation', 'modernization', 'digitalization'
  ]

  const innovationMatches = innovationKeywords.filter(keyword =>
    project.description?.toLowerCase().includes(keyword)
  ).length

  const innovationScore = Math.min(100, 40 + (innovationMatches * 15))
  score += innovationScore * weights.innovationPotential

  // Sustainability Impact
  const sustainabilityScore =
    (project.sustainability ? 30 : 0) +
    (project.sustainability?.includes('financial') ? 20 : 0) +
    (project.sustainability?.includes('institutional') ? 20 : 0) +
    (project.sustainability?.includes('environmental') ? 30 : 0)

  score += sustainabilityScore * weights.sustainabilityImpact

  return Math.round(Math.min(100, Math.max(0, score)))
}

/**
 * Calculate MATURITY score based on implementation readiness
 * Evaluates feasibility, planning quality, and execution capability
 */
export function calculateMaturityScore(project: any): number {
  let score = 0
  const weights = {
    implementationPlan: 0.20,
    budgetClarity: 0.15,
    partnerCapacity: 0.15,
    riskManagement: 0.15,
    monitoringFramework: 0.10,
    timelineRealism: 0.10,
    technicalReadiness: 0.15
  }

  // Implementation Plan Quality
  const hasDetailedPlan =
    (project.methodology ? 20 : 0) +
    (project.methodology?.length > 200 ? 15 : 5) +
    (project.activities ? 15 : 0) +
    (project.deliverables ? 15 : 0) +
    (project.timeline ? 15 : 0) +
    (project.milestones ? 20 : 0)
  score += hasDetailedPlan * weights.implementationPlan

  // Budget Clarity and Realism
  const budgetScore =
    (project.totalBudget ? 30 : 0) +
    (project.euContribution ? 20 : 0) +
    (project.partnerContribution ? 20 : 0) +
    (project.budgetBreakdown ? 30 : 0)
  score += budgetScore * weights.budgetClarity

  // Partner Capacity and Experience
  const partnerScore =
    (project.leadPartner ? 25 : 0) +
    (project.partners?.length > 0 ? 25 : 0) +
    (project.partnerExperience ? 25 : 0) +
    (project.partnerRoles ? 25 : 0)
  score += partnerScore * weights.partnerCapacity

  // Risk Management
  const riskScore =
    (project.risks ? 30 : 0) +
    (project.risks?.includes('technical') ? 15 : 0) +
    (project.risks?.includes('financial') ? 15 : 0) +
    (project.risks?.includes('organizational') ? 15 : 0) +
    (project.mitigation ? 25 : 0)
  score += riskScore * weights.riskManagement

  // Monitoring and Evaluation Framework
  const monitoringScore =
    (project.indicators ? 40 : 0) +
    (project.monitoringPlan ? 30 : 0) +
    (project.evaluationApproach ? 30 : 0)
  score += monitoringScore * weights.monitoringFramework

  // Timeline Realism
  const timelineScore =
    (project.duration ? 30 : 0) +
    (project.duration && project.duration >= 12 && project.duration <= 36 ? 40 : 20) +
    (project.phases ? 30 : 0)
  score += timelineScore * weights.timelineRealism

  // Technical Readiness
  const technicalScore =
    (project.technicalSpecifications ? 35 : 0) +
    (project.feasibilityStudy ? 35 : 0) +
    (project.preparatoryWork ? 30 : 0)
  score += technicalScore * weights.technicalReadiness

  return Math.round(Math.min(100, Math.max(0, score)))
}

/**
 * Calculate climate contribution percentage
 * IPA III target: 18% minimum, 20% by 2027
 */
export function calculateClimateContribution(project: any): number {
  if (!project.totalBudget) return 0

  let climateAmount = 0
  const totalBudget = parseFloat(project.totalBudget) || 0

  // Direct climate actions (100% counted)
  const directClimateKeywords = [
    'renewable energy', 'solar', 'wind', 'hydro',
    'energy efficiency', 'insulation', 'green infrastructure',
    'climate adaptation', 'climate mitigation', 'carbon reduction',
    'electric vehicle', 'sustainable transport', 'cycling infrastructure'
  ]

  const hasDirectClimate = directClimateKeywords.some(keyword =>
    project.description?.toLowerCase().includes(keyword) ||
    project.objectives?.toLowerCase().includes(keyword)
  )

  if (hasDirectClimate) {
    climateAmount += totalBudget * 0.6 // Assume 60% for direct climate projects
  }

  // Indirect climate actions (40% counted)
  const indirectClimateKeywords = [
    'sustainable', 'circular economy', 'waste management',
    'water management', 'biodiversity', 'forest', 'agriculture',
    'smart city', 'digital transformation'
  ]

  const hasIndirectClimate = indirectClimateKeywords.some(keyword =>
    project.description?.toLowerCase().includes(keyword)
  )

  if (hasIndirectClimate && !hasDirectClimate) {
    climateAmount += totalBudget * 0.3 * 0.4 // 30% of budget, 40% counted
  }

  // Window 3 projects get automatic climate contribution
  if (project.ipaWindow === 'window3') {
    climateAmount = Math.max(climateAmount, totalBudget * 0.5)
  }

  const percentage = totalBudget > 0 ? (climateAmount / totalBudget) * 100 : 0
  return Math.round(Math.min(100, percentage))
}

/**
 * Assess cross-cutting priorities integration
 */
export function assessCrossCuttingPriorities(project: any): CrossCuttingPriority {
  const priorities: CrossCuttingPriority = {
    genderEquality: 0,
    environmentalProtection: 0,
    climateAction: 0,
    digitalTransformation: 0,
    goodGovernance: 0,
    youthInclusion: 0
  }

  // Gender Equality Assessment
  const genderKeywords = ['gender', 'women', 'equality', 'inclusion', 'empowerment']
  const genderMatches = genderKeywords.filter(keyword =>
    project.description?.toLowerCase().includes(keyword)
  ).length
  priorities.genderEquality = Math.min(100, 30 + (genderMatches * 20))

  // Environmental Protection
  const envKeywords = ['environment', 'ecosystem', 'biodiversity', 'conservation', 'pollution']
  const envMatches = envKeywords.filter(keyword =>
    project.description?.toLowerCase().includes(keyword)
  ).length
  priorities.environmentalProtection = Math.min(100, 30 + (envMatches * 20))

  // Climate Action
  priorities.climateAction = calculateClimateContribution(project)

  // Digital Transformation
  const digitalKeywords = ['digital', 'ICT', 'e-governance', 'online', 'software', 'platform']
  const digitalMatches = digitalKeywords.filter(keyword =>
    project.description?.toLowerCase().includes(keyword)
  ).length
  priorities.digitalTransformation = Math.min(100, 20 + (digitalMatches * 20))

  // Good Governance
  const governanceKeywords = ['transparency', 'accountability', 'participation', 'integrity', 'efficiency']
  const govMatches = governanceKeywords.filter(keyword =>
    project.description?.toLowerCase().includes(keyword)
  ).length
  priorities.goodGovernance = Math.min(100, 30 + (govMatches * 18))

  // Youth Inclusion
  const youthKeywords = ['youth', 'young', 'students', 'education', 'skills', 'training']
  const youthMatches = youthKeywords.filter(keyword =>
    project.description?.toLowerCase().includes(keyword)
  ).length
  priorities.youthInclusion = Math.min(100, 20 + (youthMatches * 20))

  return priorities
}

/**
 * Generate performance indicators based on project type and window
 */
export function generatePerformanceIndicators(project: any): PerformanceIndicator[] {
  const indicators: PerformanceIndicator[] = []

  // Window-specific indicators
  const windowIndicators: Record<string, PerformanceIndicator[]> = {
    window1: [
      {
        id: 'w1_judicial_efficiency',
        category: 'result',
        description: 'Reduction in case backlog',
        target: 30,
        baseline: 0,
        unit: '%',
        verification: 'Court statistics'
      },
      {
        id: 'w1_corruption_perception',
        category: 'impact',
        description: 'Improvement in corruption perception index',
        target: 5,
        baseline: 0,
        unit: 'points',
        verification: 'Transparency International CPI'
      }
    ],
    window2: [
      {
        id: 'w2_public_services',
        category: 'output',
        description: 'Public services digitalized',
        target: 10,
        baseline: 0,
        unit: 'services',
        verification: 'Government reports'
      },
      {
        id: 'w2_citizen_satisfaction',
        category: 'result',
        description: 'Citizen satisfaction with public services',
        target: 75,
        baseline: 50,
        unit: '%',
        verification: 'Citizen surveys'
      }
    ],
    window3: [
      {
        id: 'w3_co2_reduction',
        category: 'impact',
        description: 'CO2 emissions reduced',
        target: 1000,
        baseline: 0,
        unit: 'tons/year',
        verification: 'Environmental monitoring'
      },
      {
        id: 'w3_renewable_capacity',
        category: 'output',
        description: 'Renewable energy capacity installed',
        target: 5,
        baseline: 0,
        unit: 'MW',
        verification: 'Energy authority data'
      }
    ],
    window4: [
      {
        id: 'w4_jobs_created',
        category: 'result',
        description: 'New jobs created',
        target: 100,
        baseline: 0,
        unit: 'jobs',
        verification: 'Employment records'
      },
      {
        id: 'w4_smes_supported',
        category: 'output',
        description: 'SMEs receiving support',
        target: 50,
        baseline: 0,
        unit: 'enterprises',
        verification: 'Programme records'
      }
    ],
    window5: [
      {
        id: 'w5_cross_border',
        category: 'output',
        description: 'Cross-border partnerships established',
        target: 5,
        baseline: 0,
        unit: 'partnerships',
        verification: 'Partnership agreements'
      },
      {
        id: 'w5_people_exchanges',
        category: 'result',
        description: 'People participating in exchanges',
        target: 500,
        baseline: 0,
        unit: 'persons',
        verification: 'Participation records'
      }
    ]
  }

  // Add window-specific indicators
  if (windowIndicators[project.ipaWindow]) {
    indicators.push(...windowIndicators[project.ipaWindow])
  }

  // Add common indicators for all projects
  indicators.push({
    id: 'common_budget_execution',
    category: 'output',
    description: 'Budget execution rate',
    target: 95,
    baseline: 0,
    unit: '%',
    verification: 'Financial reports'
  })

  indicators.push({
    id: 'common_beneficiaries',
    category: 'result',
    description: 'Direct beneficiaries reached',
    target: 1000,
    baseline: 0,
    unit: 'persons',
    verification: 'Beneficiary database'
  })

  return indicators
}

/**
 * Generate recommendations based on assessment
 */
export function generateRecommendations(
  relevanceScore: number,
  maturityScore: number,
  climateContribution: number,
  crossCuttingPriorities: CrossCuttingPriority
): string[] {
  const recommendations: string[] = []

  // Relevance recommendations
  if (relevanceScore < 70) {
    recommendations.push('Strengthen alignment with EU acquis chapters and national strategies')
    recommendations.push('Enhance regional cooperation elements to increase strategic relevance')
  }
  if (relevanceScore < 50) {
    recommendations.push('CRITICAL: Project lacks clear strategic alignment with IPA III priorities')
  }

  // Maturity recommendations
  if (maturityScore < 70) {
    recommendations.push('Develop more detailed implementation plan with clear milestones')
    recommendations.push('Strengthen risk management framework and mitigation strategies')
  }
  if (maturityScore < 50) {
    recommendations.push('CRITICAL: Project readiness is insufficient for implementation')
  }

  // Climate recommendations
  if (climateContribution < 18) {
    recommendations.push('IMPORTANT: Increase climate-related activities to meet 18% minimum target')
  }

  // Cross-cutting priorities
  if (crossCuttingPriorities.genderEquality < 40) {
    recommendations.push('Integrate gender equality measures and women empowerment activities')
  }
  if (crossCuttingPriorities.digitalTransformation < 30) {
    recommendations.push('Consider adding digital transformation components')
  }
  if (crossCuttingPriorities.youthInclusion < 30) {
    recommendations.push('Include youth participation and skill development activities')
  }

  return recommendations
}

/**
 * Main performance assessment function
 */
export function performComprehensiveAssessment(project: any): PerformanceAssessment {
  const relevanceScore = calculateRelevanceScore(project)
  const maturityScore = calculateMaturityScore(project)
  const performanceScore = (relevanceScore * 0.6) + (maturityScore * 0.4) // 60/40 weighting
  const climateContribution = calculateClimateContribution(project)
  const crossCuttingPriorities = assessCrossCuttingPriorities(project)
  const indicators = generatePerformanceIndicators(project)
  const recommendations = generateRecommendations(
    relevanceScore,
    maturityScore,
    climateContribution,
    crossCuttingPriorities
  )

  const compliance = {
    meetsRelevanceCriteria: relevanceScore >= 65,
    meetsMaturityCriteria: maturityScore >= 60,
    meetsClimateTarget: climateContribution >= 18,
    overallCompliant: relevanceScore >= 65 && maturityScore >= 60
  }

  return {
    relevanceScore,
    maturityScore,
    performanceScore: Math.round(performanceScore),
    climateContribution,
    crossCuttingPriorities,
    indicators,
    recommendations,
    compliance
  }
}

/**
 * Export performance assessment data for reporting
 */
export function exportAssessmentReport(assessment: PerformanceAssessment): string {
  const report = `
IPA III PERFORMANCE ASSESSMENT REPORT
=====================================

OVERALL PERFORMANCE SCORE: ${assessment.performanceScore}/100
STATUS: ${assessment.compliance.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}

1. RELEVANCE SCORE: ${assessment.relevanceScore}/100
   Status: ${assessment.compliance.meetsRelevanceCriteria ? 'PASS' : 'FAIL'}

2. MATURITY SCORE: ${assessment.maturityScore}/100
   Status: ${assessment.compliance.meetsMaturityCriteria ? 'PASS' : 'FAIL'}

3. CLIMATE CONTRIBUTION: ${assessment.climateContribution}%
   Target: 18% minimum
   Status: ${assessment.compliance.meetsClimateTarget ? 'ACHIEVED' : 'BELOW TARGET'}

4. CROSS-CUTTING PRIORITIES:
   - Gender Equality: ${assessment.crossCuttingPriorities.genderEquality}%
   - Environmental Protection: ${assessment.crossCuttingPriorities.environmentalProtection}%
   - Climate Action: ${assessment.crossCuttingPriorities.climateAction}%
   - Digital Transformation: ${assessment.crossCuttingPriorities.digitalTransformation}%
   - Good Governance: ${assessment.crossCuttingPriorities.goodGovernance}%
   - Youth Inclusion: ${assessment.crossCuttingPriorities.youthInclusion}%

5. PERFORMANCE INDICATORS: ${assessment.indicators.length} defined

6. RECOMMENDATIONS:
${assessment.recommendations.map(r => `   - ${r}`).join('\n')}

=====================================
Generated: ${new Date().toISOString()}
  `

  return report
}