/**
 * IPA III Validator Module
 * Validates projects against official IPA III requirements
 * Based on Regulation (EU) 2021/1529
 */

import { Project } from '@prisma/client'
import { performComprehensiveAssessment } from './performance-assessment'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  recommendations: string[]
  complianceLevel: 'non-compliant' | 'partially-compliant' | 'compliant' | 'excellent'
}

export interface ValidationError {
  field: string
  message: string
  severity: 'critical' | 'major' | 'minor'
}

export interface ValidationWarning {
  field: string
  message: string
  impact: string
}

/**
 * Main validation function for IPA III compliance
 */
export function validateIPA3Project(project: any): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const recommendations: string[] = []

  // Perform comprehensive assessment
  const assessment = performComprehensiveAssessment(project)

  // 1. MANDATORY FIELDS VALIDATION
  validateMandatoryFields(project, errors)

  // 2. WINDOW ALIGNMENT VALIDATION
  validateWindowAlignment(project, errors, warnings)

  // 3. BUDGET VALIDATION
  validateBudget(project, errors, warnings)

  // 4. PERFORMANCE CRITERIA VALIDATION
  validatePerformanceCriteria(assessment, errors, warnings)

  // 5. CLIMATE TARGET VALIDATION
  validateClimateTarget(assessment, errors, warnings)

  // 6. CROSS-CUTTING PRIORITIES VALIDATION
  validateCrossCuttingPriorities(assessment, warnings, recommendations)

  // 7. IMPLEMENTATION READINESS
  validateImplementationReadiness(project, warnings, recommendations)

  // 8. PARTNERSHIP VALIDATION
  validatePartnership(project, warnings)

  // 9. MONITORING FRAMEWORK VALIDATION
  validateMonitoringFramework(project, warnings, recommendations)

  // 10. SUSTAINABILITY VALIDATION
  validateSustainability(project, warnings, recommendations)

  // Determine compliance level
  const complianceLevel = determineComplianceLevel(errors, warnings, assessment)

  // Generate final recommendations
  generateFinalRecommendations(assessment, errors, warnings, recommendations)

  return {
    isValid: errors.filter(e => e.severity === 'critical').length === 0,
    errors,
    warnings,
    recommendations: Array.from(new Set(recommendations)), // Remove duplicates
    complianceLevel
  }
}

/**
 * Validate mandatory fields
 */
function validateMandatoryFields(project: any, errors: ValidationError[]) {
  const mandatoryFields = [
    { field: 'title', name: 'Project Title' },
    { field: 'municipality', name: 'Municipality' },
    { field: 'country', name: 'Country' },
    { field: 'ipaWindow', name: 'IPA Window' },
    { field: 'description', name: 'Project Description' },
    { field: 'objectives', name: 'Objectives' }
  ]

  mandatoryFields.forEach(({ field, name }) => {
    if (!project[field] || project[field].trim() === '') {
      errors.push({
        field,
        message: `${name} is mandatory for IPA III applications`,
        severity: 'critical'
      })
    } else if (project[field].length < 50 && field === 'description') {
      errors.push({
        field,
        message: 'Project description must be at least 50 characters',
        severity: 'major'
      })
    }
  })

  // Check SMART objectives
  if (project.smartObjectives) {
    const smartFields = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound']
    const filledSmart = smartFields.filter(f => project.smartObjectives[f]?.trim())

    if (filledSmart.length === 0) {
      errors.push({
        field: 'smartObjectives',
        message: 'At least one SMART objective must be defined',
        severity: 'major'
      })
    } else if (filledSmart.length < 3) {
      errors.push({
        field: 'smartObjectives',
        message: 'At least 3 SMART objectives should be defined for strong applications',
        severity: 'minor'
      })
    }
  }
}

/**
 * Validate window alignment
 */
function validateWindowAlignment(project: any, errors: ValidationError[], warnings: ValidationWarning[]) {
  if (!project.ipaWindow) {
    return // Already caught in mandatory fields
  }

  const windowKeywords: Record<string, string[]> = {
    window1: ['rule of law', 'judicial', 'corruption', 'fundamental rights', 'justice'],
    window2: ['governance', 'democracy', 'civil society', 'public administration', 'transparency'],
    window3: ['green', 'climate', 'environment', 'sustainable', 'renewable', 'energy'],
    window4: ['digital', 'innovation', 'competitiveness', 'SME', 'entrepreneurship', 'economic'],
    window5: ['cross-border', 'territorial', 'cooperation', 'regional', 'partnership']
  }

  const expectedKeywords = windowKeywords[project.ipaWindow] || []
  const projectText = `${project.description} ${project.objectives}`.toLowerCase()

  const matchedKeywords = expectedKeywords.filter(keyword => projectText.includes(keyword))

  if (matchedKeywords.length === 0) {
    errors.push({
      field: 'ipaWindow',
      message: `Project content does not align with ${project.ipaWindow} priorities`,
      severity: 'major'
    })
  } else if (matchedKeywords.length < 2) {
    warnings.push({
      field: 'ipaWindow',
      message: `Weak alignment with ${project.ipaWindow} priorities`,
      impact: 'May reduce relevance score'
    })
  }
}

/**
 * Validate budget structure
 */
function validateBudget(project: any, errors: ValidationError[], warnings: ValidationWarning[]) {
  if (project.totalBudget) {
    const totalBudget = parseFloat(project.totalBudget)

    if (totalBudget < 100000) {
      warnings.push({
        field: 'totalBudget',
        message: 'Budget below €100,000 may not meet minimum threshold',
        impact: 'Consider combining with other initiatives'
      })
    }

    if (totalBudget > 10000000) {
      warnings.push({
        field: 'totalBudget',
        message: 'Budget above €10M requires enhanced justification',
        impact: 'Ensure detailed budget breakdown and clear deliverables'
      })
    }
  }

  // Check co-financing
  if (project.euContribution && project.partnerContribution) {
    const euContrib = parseFloat(project.euContribution)
    const partnerContrib = parseFloat(project.partnerContribution)
    const totalContrib = euContrib + partnerContrib

    if (totalContrib > 0) {
      const euPercentage = (euContrib / totalContrib) * 100

      if (euPercentage > 85) {
        errors.push({
          field: 'euContribution',
          message: 'EU contribution cannot exceed 85% for IPA III projects',
          severity: 'critical'
        })
      } else if (euPercentage > 80) {
        warnings.push({
          field: 'euContribution',
          message: 'EU contribution above 80% requires strong justification',
          impact: 'May affect project approval'
        })
      }

      if (euPercentage < 50) {
        warnings.push({
          field: 'euContribution',
          message: 'Low EU contribution request',
          impact: 'Consider if IPA III is the appropriate funding source'
        })
      }
    }
  }
}

/**
 * Validate performance criteria
 */
function validatePerformanceCriteria(assessment: any, errors: ValidationError[], warnings: ValidationWarning[]) {
  // Relevance score validation
  if (assessment.relevanceScore < 50) {
    errors.push({
      field: 'relevance',
      message: 'Project relevance score is critically low',
      severity: 'critical'
    })
  } else if (assessment.relevanceScore < 65) {
    errors.push({
      field: 'relevance',
      message: 'Project does not meet minimum relevance threshold (65)',
      severity: 'major'
    })
  } else if (assessment.relevanceScore < 75) {
    warnings.push({
      field: 'relevance',
      message: 'Relevance score is acceptable but could be improved',
      impact: 'Strengthen alignment with EU priorities'
    })
  }

  // Maturity score validation
  if (assessment.maturityScore < 45) {
    errors.push({
      field: 'maturity',
      message: 'Project is not ready for implementation',
      severity: 'critical'
    })
  } else if (assessment.maturityScore < 60) {
    errors.push({
      field: 'maturity',
      message: 'Project does not meet minimum maturity threshold (60)',
      severity: 'major'
    })
  } else if (assessment.maturityScore < 70) {
    warnings.push({
      field: 'maturity',
      message: 'Maturity score indicates implementation risks',
      impact: 'Develop detailed implementation plan'
    })
  }
}

/**
 * Validate climate target
 */
function validateClimateTarget(assessment: any, errors: ValidationError[], warnings: ValidationWarning[]) {
  const climateContribution = assessment.climateContribution

  if (climateContribution < 10) {
    warnings.push({
      field: 'climate',
      message: 'Very low climate contribution',
      impact: 'Consider adding climate-related activities'
    })
  } else if (climateContribution < 18) {
    errors.push({
      field: 'climate',
      message: `Climate contribution (${climateContribution}%) below IPA III minimum target (18%)`,
      severity: 'major'
    })
  } else if (climateContribution < 20) {
    warnings.push({
      field: 'climate',
      message: 'Climate contribution meets minimum but below 2027 target (20%)',
      impact: 'Consider enhancing climate components'
    })
  }
}

/**
 * Validate cross-cutting priorities
 */
function validateCrossCuttingPriorities(assessment: any, warnings: ValidationWarning[], recommendations: string[]) {
  const priorities = assessment.crossCuttingPriorities

  if (priorities.genderEquality < 30) {
    warnings.push({
      field: 'gender',
      message: 'Insufficient gender equality integration',
      impact: 'Add gender-specific objectives and activities'
    })
    recommendations.push('Include gender impact assessment and women empowerment activities')
  }

  if (priorities.digitalTransformation < 20) {
    recommendations.push('Consider adding digital transformation components to modernize project delivery')
  }

  if (priorities.goodGovernance < 40) {
    warnings.push({
      field: 'governance',
      message: 'Limited good governance elements',
      impact: 'Strengthen transparency and accountability measures'
    })
  }

  if (priorities.youthInclusion < 25) {
    recommendations.push('Include youth participation and capacity building activities')
  }

  if (priorities.environmentalProtection < 30) {
    warnings.push({
      field: 'environment',
      message: 'Low environmental protection focus',
      impact: 'Add environmental safeguards and sustainability measures'
    })
  }
}

/**
 * Validate implementation readiness
 */
function validateImplementationReadiness(project: any, warnings: ValidationWarning[], recommendations: string[]) {
  if (!project.methodology || project.methodology.length < 100) {
    warnings.push({
      field: 'methodology',
      message: 'Implementation methodology is insufficient',
      impact: 'Develop detailed implementation approach'
    })
  }

  if (!project.timeline) {
    warnings.push({
      field: 'timeline',
      message: 'No implementation timeline provided',
      impact: 'Define clear project phases and milestones'
    })
    recommendations.push('Create a detailed Gantt chart with key milestones')
  }

  if (!project.milestones) {
    warnings.push({
      field: 'milestones',
      message: 'No milestones defined',
      impact: 'Set measurable milestones for progress tracking'
    })
  }

  if (!project.risks || project.risks.length < 50) {
    warnings.push({
      field: 'risks',
      message: 'Risk assessment is inadequate',
      impact: 'Conduct comprehensive risk analysis'
    })
    recommendations.push('Develop risk register with mitigation strategies')
  }
}

/**
 * Validate partnership structure
 */
function validatePartnership(project: any, warnings: ValidationWarning[]) {
  if (!project.leadPartner) {
    warnings.push({
      field: 'leadPartner',
      message: 'No lead partner identified',
      impact: 'Identify organization responsible for implementation'
    })
  }

  if (!project.partners || project.partners === '[]') {
    warnings.push({
      field: 'partners',
      message: 'No implementation partners defined',
      impact: 'Consider partnerships for enhanced capacity'
    })
  }

  // For Window 5 (cross-border), partnerships are mandatory
  if (project.ipaWindow === 'window5' && (!project.partners || project.partners === '[]')) {
    warnings.push({
      field: 'partners',
      message: 'Cross-border projects require multiple country partners',
      impact: 'Critical requirement for Window 5'
    })
  }
}

/**
 * Validate monitoring framework
 */
function validateMonitoringFramework(project: any, warnings: ValidationWarning[], recommendations: string[]) {
  if (!project.monitoringPlan) {
    warnings.push({
      field: 'monitoringPlan',
      message: 'No monitoring and evaluation framework',
      impact: 'Define how progress will be measured'
    })
    recommendations.push('Develop M&E framework with clear indicators and verification methods')
  }

  if (!project.indicators) {
    warnings.push({
      field: 'indicators',
      message: 'No performance indicators defined',
      impact: 'Set SMART indicators for result measurement'
    })
  }

  if (!project.evaluationApproach) {
    recommendations.push('Include mid-term and final evaluation plans')
  }
}

/**
 * Validate sustainability
 */
function validateSustainability(project: any, warnings: ValidationWarning[], recommendations: string[]) {
  if (!project.sustainability || project.sustainability.length < 100) {
    warnings.push({
      field: 'sustainability',
      message: 'Sustainability plan is insufficient',
      impact: 'Demonstrate long-term viability'
    })
  }

  const sustainabilityText = project.sustainability?.toLowerCase() || ''

  if (!sustainabilityText.includes('financial')) {
    recommendations.push('Address financial sustainability beyond project period')
  }

  if (!sustainabilityText.includes('institutional')) {
    recommendations.push('Define institutional arrangements for continuation')
  }

  if (!sustainabilityText.includes('environmental')) {
    recommendations.push('Include environmental sustainability measures')
  }
}

/**
 * Determine overall compliance level
 */
function determineComplianceLevel(
  errors: ValidationError[],
  warnings: ValidationWarning[],
  assessment: any
): 'non-compliant' | 'partially-compliant' | 'compliant' | 'excellent' {
  const criticalErrors = errors.filter(e => e.severity === 'critical').length
  const majorErrors = errors.filter(e => e.severity === 'major').length
  const minorErrors = errors.filter(e => e.severity === 'minor').length

  if (criticalErrors > 0) {
    return 'non-compliant'
  }

  if (majorErrors > 2) {
    return 'non-compliant'
  }

  if (majorErrors > 0 || assessment.performanceScore < 65) {
    return 'partially-compliant'
  }

  if (assessment.performanceScore >= 80 && warnings.length < 3 && minorErrors === 0) {
    return 'excellent'
  }

  return 'compliant'
}

/**
 * Generate final recommendations
 */
function generateFinalRecommendations(
  assessment: any,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  recommendations: string[]
) {
  // Priority recommendations based on errors
  if (errors.some(e => e.field === 'relevance')) {
    recommendations.unshift('PRIORITY: Strengthen strategic alignment with IPA III objectives and EU acquis')
  }

  if (errors.some(e => e.field === 'maturity')) {
    recommendations.unshift('PRIORITY: Develop comprehensive implementation plan with clear deliverables')
  }

  if (errors.some(e => e.field === 'climate')) {
    recommendations.unshift('PRIORITY: Increase climate-related activities to meet 18% minimum target')
  }

  // Add performance-based recommendations
  if (assessment.performanceScore < 70) {
    recommendations.push('Consider technical assistance to strengthen project design')
  }

  if (assessment.relevanceScore > 75 && assessment.maturityScore < 65) {
    recommendations.push('Focus on implementation readiness - good strategic alignment but needs operational planning')
  }

  if (assessment.maturityScore > 75 && assessment.relevanceScore < 65) {
    recommendations.push('Enhance strategic narrative - implementation ready but needs stronger EU alignment')
  }

  // Add excellence pathway if close
  if (assessment.performanceScore >= 75 && assessment.performanceScore < 80) {
    recommendations.push('Project is close to excellence level - minor improvements could significantly enhance competitiveness')
  }
}

/**
 * Export validation report
 */
export function exportValidationReport(validation: ValidationResult, project: any): string {
  const report = `
IPA III COMPLIANCE VALIDATION REPORT
=====================================
Project: ${project.title || 'Untitled'}
Municipality: ${project.municipality || 'Not specified'}
IPA Window: ${project.ipaWindow || 'Not selected'}
Date: ${new Date().toISOString()}

COMPLIANCE STATUS: ${validation.complianceLevel.toUpperCase()}
VALIDATION RESULT: ${validation.isValid ? 'PASS' : 'FAIL'}

=====================================
ERRORS (${validation.errors.length})
=====================================
${validation.errors.map(e => `[${e.severity.toUpperCase()}] ${e.field}: ${e.message}`).join('\n') || 'No errors found'}

=====================================
WARNINGS (${validation.warnings.length})
=====================================
${validation.warnings.map(w => `${w.field}: ${w.message}\n  Impact: ${w.impact}`).join('\n\n') || 'No warnings'}

=====================================
RECOMMENDATIONS (${validation.recommendations.length})
=====================================
${validation.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n') || 'No additional recommendations'}

=====================================
NEXT STEPS
=====================================
${validation.complianceLevel === 'non-compliant' ? '1. Address all critical and major errors\n2. Strengthen project design based on recommendations\n3. Consider technical assistance for project development' : ''}
${validation.complianceLevel === 'partially-compliant' ? '1. Resolve remaining major errors\n2. Implement key recommendations\n3. Enhance weak areas identified in warnings' : ''}
${validation.complianceLevel === 'compliant' ? '1. Address any remaining warnings\n2. Consider recommendations for strengthening\n3. Proceed with application submission' : ''}
${validation.complianceLevel === 'excellent' ? '1. Minor refinements based on recommendations\n2. Prepare for fast-track review\n3. Consider as best practice example' : ''}

=====================================
Generated by IPA III Validator v1.0
Based on Regulation (EU) 2021/1529
  `

  return report
}