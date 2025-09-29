/**
 * 🎯 ULTRATHINK: Real-Time Excellence Validation System
 * Live quality scoring, compliance validation, and improvement suggestions
 * Prevents common mistakes and ensures submission-ready quality
 */

import { generateMunicipalityIntelligence } from './municipality-intelligence';

// Stub function for window synergies detection
function detectWindowSynergies(projectData: any) {
  // Placeholder implementation - returns basic synergy detection
  return {
    synergyScore: 0.5,
    detectedSynergies: [],
    recommendations: [],
    synergyWindows: ['Window 3', 'Window 4']
  };
}

export interface ValidationResult {
  score: number; // 0-100 overall excellence score
  level: 'poor' | 'basic' | 'good' | 'excellent';
  criticalIssues: ValidationIssue[];
  improvements: ValidationSuggestion[];
  complianceChecks: ComplianceCheck[];
  recommendations: string[];
}

export interface ValidationIssue {
  field: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

export interface ValidationSuggestion {
  field: string;
  type: 'content' | 'structure' | 'compliance' | 'synergy';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ComplianceCheck {
  rule: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  requirement: string;
}

// 🎯 COMPREHENSIVE PROJECT VALIDATION ENGINE
export function validateProjectExcellence(projectData: any): ValidationResult {
  const issues: ValidationIssue[] = [];
  const suggestions: ValidationSuggestion[] = [];
  const complianceChecks: ComplianceCheck[] = [];
  let score = 0;

  // 1. BASIC COMPLETENESS VALIDATION (30 points)
  score += validateBasicCompleteness(projectData, issues, suggestions);

  // 2. CONTENT QUALITY ASSESSMENT (25 points)
  score += validateContentQuality(projectData, issues, suggestions);

  // 3. EU COMPLIANCE CHECKS (20 points)
  score += validateEUCompliance(projectData, issues, complianceChecks);

  // 4. SYNERGY & INNOVATION ASSESSMENT (15 points)
  score += validateSynergyAndInnovation(projectData, suggestions);

  // 5. MUNICIPALITY ALIGNMENT (10 points)
  score += validateMunicipalityAlignment(projectData, suggestions);

  // Determine excellence level
  const level = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'basic' : 'poor';

  // Generate strategic recommendations
  const recommendations = generateStrategicRecommendations(projectData, score, level);

  return {
    score: Math.round(score),
    level,
    criticalIssues: issues.filter(i => i.severity === 'critical'),
    improvements: suggestions.filter(s => s.impact === 'high').slice(0, 5),
    complianceChecks,
    recommendations
  };
}

// 🔍 VALIDATION FUNCTIONS

function validateBasicCompleteness(projectData: any, issues: ValidationIssue[], suggestions: ValidationSuggestion[]): number {
  let score = 0;
  const requiredFields = ['title', 'municipality', 'country', 'ipaWindow', 'description', 'objectives'];
  const optionalFields = ['methodology', 'risks', 'sustainability', 'budget', 'duration'];

  // Check required fields (20 points)
  requiredFields.forEach(field => {
    if (!projectData[field] || String(projectData[field]).trim().length === 0) {
      issues.push({
        field,
        severity: 'critical',
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
        suggestion: `Provide a comprehensive ${field} to continue`
      });
    } else {
      score += 20 / requiredFields.length;
    }
  });

  // Check optional fields (10 points)
  const filledOptional = optionalFields.filter(field => projectData[field] && String(projectData[field]).trim().length > 0);
  score += (filledOptional.length / optionalFields.length) * 10;

  // SMART objectives completeness
  const smartFields = ['smartSpecific', 'smartMeasurable', 'smartAchievable', 'smartRelevant', 'smartTimeBound'];
  const filledSmart = smartFields.filter(field => projectData[field] && String(projectData[field]).trim().length > 0);

  if (filledSmart.length < smartFields.length) {
    suggestions.push({
      field: 'smartObjectives',
      type: 'content',
      title: 'Complete SMART Objectives',
      description: `${smartFields.length - filledSmart.length} SMART objective fields need completion`,
      impact: 'high'
    });
  }

  return score;
}

function validateContentQuality(projectData: any, issues: ValidationIssue[], suggestions: ValidationSuggestion[]): number {
  let score = 0;

  // Description quality (10 points)
  if (projectData.description) {
    const descLength = String(projectData.description).length;
    if (descLength < 500) {
      issues.push({
        field: 'description',
        severity: 'warning',
        message: 'Description is too brief for EU standards',
        suggestion: 'Expand to at least 800-1500 words for comprehensive coverage'
      });
      score += 3;
    } else if (descLength < 800) {
      score += 6;
    } else {
      score += 10;
    }
  }

  // Objectives quality (8 points)
  if (projectData.objectives) {
    const objLength = String(projectData.objectives).length;
    const hasNumbers = /\d+/.test(projectData.objectives);
    const hasTargets = /target|goal|achieve|improve/.test(projectData.objectives.toLowerCase());

    if (objLength > 300 && hasNumbers && hasTargets) {
      score += 8;
    } else if (objLength > 200) {
      score += 5;
      if (!hasNumbers) {
        suggestions.push({
          field: 'objectives',
          type: 'content',
          title: 'Add Quantitative Targets',
          description: 'Include specific numbers and measurable targets in objectives',
          impact: 'medium'
        });
      }
    } else {
      score += 2;
    }
  }

  // Budget reasonableness (7 points)
  if (projectData.budget) {
    const budgetMatch = String(projectData.budget).match(/[\d,]+/);
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[0].replace(/,/g, ''));
      if (amount >= 200000 && amount <= 10000000) {
        score += 7;
      } else if (amount < 200000) {
        suggestions.push({
          field: 'budget',
          type: 'compliance',
          title: 'Consider Higher Budget',
          description: 'Budget seems low for typical IPA III municipal projects (€200K-€10M range)',
          impact: 'medium'
        });
        score += 3;
      } else {
        suggestions.push({
          field: 'budget',
          type: 'compliance',
          title: 'Budget May Be Too High',
          description: 'Very high budget may require additional justification and capacity demonstration',
          impact: 'medium'
        });
        score += 5;
      }
    }
  }

  return score;
}

function validateEUCompliance(projectData: any, issues: ValidationIssue[], complianceChecks: ComplianceCheck[]): number {
  let score = 0;

  // IPA Window selection (5 points)
  if (projectData.ipaWindow) {
    complianceChecks.push({
      rule: 'IPA III Window Selection',
      status: 'pass',
      message: `Project aligned with ${projectData.ipaWindow}`,
      requirement: 'Must select appropriate IPA III thematic window'
    });
    score += 5;
  } else {
    complianceChecks.push({
      rule: 'IPA III Window Selection',
      status: 'fail',
      message: 'No IPA window selected',
      requirement: 'Must select appropriate IPA III thematic window'
    });
  }

  // Country eligibility (5 points)
  const eligibleCountries = ['Albania', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia', 'Serbia', 'Kosovo'];
  if (eligibleCountries.includes(projectData.country)) {
    complianceChecks.push({
      rule: 'Geographic Eligibility',
      status: 'pass',
      message: `${projectData.country} is eligible for IPA III funding`,
      requirement: 'Must be Western Balkan beneficiary country'
    });
    score += 5;
  } else {
    complianceChecks.push({
      rule: 'Geographic Eligibility',
      status: 'fail',
      message: `${projectData.country} eligibility needs verification`,
      requirement: 'Must be Western Balkan beneficiary country'
    });
  }

  // Duration reasonableness (5 points)
  if (projectData.duration) {
    const duration = parseInt(String(projectData.duration).match(/\d+/)?.[0] || '0');
    if (duration >= 12 && duration <= 36) {
      complianceChecks.push({
        rule: 'Project Duration',
        status: 'pass',
        message: `${duration} months is within typical IPA III project range`,
        requirement: 'Should be 12-36 months for municipal projects'
      });
      score += 5;
    } else {
      complianceChecks.push({
        rule: 'Project Duration',
        status: 'warning',
        message: `${duration} months may require special justification`,
        requirement: 'Should be 12-36 months for municipal projects'
      });
      score += 2;
    }
  }

  // Sustainability consideration (5 points)
  if (projectData.sustainability && String(projectData.sustainability).length > 100) {
    complianceChecks.push({
      rule: 'Sustainability Planning',
      status: 'pass',
      message: 'Sustainability measures addressed',
      requirement: 'Must demonstrate long-term sustainability'
    });
    score += 5;
  } else {
    complianceChecks.push({
      rule: 'Sustainability Planning',
      status: 'warning',
      message: 'Sustainability planning needs strengthening',
      requirement: 'Must demonstrate long-term sustainability'
    });
    score += 1;
  }

  return score;
}

function validateSynergyAndInnovation(projectData: any, suggestions: ValidationSuggestion[]): number {
  let score = 0;

  // Synergy detection (10 points)
  const synergies = detectWindowSynergies(projectData);
  if (synergies.synergyScore > 0.6) {
    score += 10;
    suggestions.push({
      field: 'description',
      type: 'synergy',
      title: 'High Synergy Potential Detected',
      description: `Strong alignment with ${synergies.synergyWindows.join(' and ')} - leverage this for enhanced impact`,
      impact: 'high'
    });
  } else if (synergies.synergyScore > 0.3) {
    score += 6;
    suggestions.push({
      field: 'objectives',
      type: 'synergy',
      title: 'Cross-Window Opportunities Available',
      description: `Consider integrating elements from ${synergies.synergyWindows.join(' and ')} for broader impact`,
      impact: 'medium'
    });
  } else {
    score += 3;
  }

  // Innovation indicators (5 points)
  const content = `${projectData.title} ${projectData.description} ${projectData.objectives}`.toLowerCase();
  const innovationKeywords = ['smart', 'digital', 'innovative', 'technology', 'new', 'advanced', 'modern', 'pilot'];
  const innovationCount = innovationKeywords.reduce((count, keyword) => {
    return count + (content.match(new RegExp(keyword, 'g')) || []).length;
  }, 0);

  if (innovationCount >= 3) {
    score += 5;
  } else if (innovationCount >= 1) {
    score += 3;
    suggestions.push({
      field: 'description',
      type: 'content',
      title: 'Enhance Innovation Elements',
      description: 'Consider highlighting innovative approaches, technologies, or methodologies',
      impact: 'medium'
    });
  } else {
    score += 1;
    suggestions.push({
      field: 'objectives',
      type: 'content',
      title: 'Add Innovation Components',
      description: 'EU funding favors innovative approaches - consider adding digital or technological elements',
      impact: 'high'
    });
  }

  return score;
}

function validateMunicipalityAlignment(projectData: any, suggestions: ValidationSuggestion[]): number {
  let score = 5; // Base score

  if (projectData.municipality) {
    const intelligence = generateMunicipalityIntelligence(projectData.municipality, projectData);

    if (intelligence.profile) {
      // Additional score for specific municipality intelligence
      score += 5;

      if (intelligence.relevantChallenges.length > 0) {
        suggestions.push({
          field: 'description',
          type: 'content',
          title: 'Address Local Challenges',
          description: `Consider addressing specific challenges: ${intelligence.relevantChallenges.join(', ')}`,
          impact: 'high'
        });
      }

      if (intelligence.alignedOpportunities.length > 0) {
        suggestions.push({
          field: 'objectives',
          type: 'content',
          title: 'Leverage Local Opportunities',
          description: `Align with local opportunities: ${intelligence.alignedOpportunities.join(', ')}`,
          impact: 'medium'
        });
      }
    }
  }

  return score;
}

function generateStrategicRecommendations(projectData: any, score: number, level: string): string[] {
  const recommendations: string[] = [];

  if (level === 'poor' || level === 'basic') {
    recommendations.push('🎯 Focus on completing all required fields with comprehensive content');
    recommendations.push('📊 Add specific quantitative targets and measurable outcomes');
    recommendations.push('🔗 Strengthen alignment with IPA III window priorities');
  }

  if (level === 'basic' || level === 'good') {
    recommendations.push('💡 Enhance innovation elements and digital transformation aspects');
    recommendations.push('🤝 Consider cross-window synergies for multiplicative impact');
    recommendations.push('🌍 Integrate specific municipality challenges and opportunities');
  }

  if (level === 'good' || level === 'excellent') {
    recommendations.push('🚀 Optimize for maximum EU assessment score with advanced methodologies');
    recommendations.push('🔄 Leverage regional cooperation and partnership opportunities');
    recommendations.push('📈 Demonstrate scalability and replication potential');
  }

  // Always include top priority based on current state
  if (score < 70) {
    recommendations.unshift('⚠️ PRIORITY: Address critical issues before submission');
  } else if (score < 85) {
    recommendations.unshift('✨ PRIORITY: Polish content for excellence level scoring');
  } else {
    recommendations.unshift('🏆 EXCELLENCE ACHIEVED: Fine-tune for maximum impact');
  }

  return recommendations;
}

// 🔄 REAL-TIME VALIDATION HELPERS

export function validateField(fieldName: string, value: string, projectData: any): {
  isValid: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
  score: number;
} {
  const issues: ValidationIssue[] = [];
  const suggestions: string[] = [];
  let score = 0;

  if (!value || value.trim().length === 0) {
    return { isValid: false, issues, suggestions, score: 0 };
  }

  // Field-specific validation
  switch (fieldName) {
    case 'title':
      if (value.length < 10) {
        issues.push({
          field: fieldName,
          severity: 'warning',
          message: 'Title seems too brief',
          suggestion: 'Consider a more descriptive title (10-100 characters)'
        });
      } else if (value.length > 100) {
        issues.push({
          field: fieldName,
          severity: 'warning',
          message: 'Title is very long',
          suggestion: 'Consider shortening for better readability'
        });
      } else {
        score = 85;
      }
      break;

    case 'description':
      if (value.length < 500) {
        suggestions.push('Expand description to 800-1500 words for EU standards');
        score = 40;
      } else if (value.length < 800) {
        suggestions.push('Consider adding more detail for comprehensive coverage');
        score = 70;
      } else {
        score = 90;
      }
      break;

    case 'budget':
      const budgetMatch = value.match(/[\d,]+/);
      if (budgetMatch) {
        const amount = parseInt(budgetMatch[0].replace(/,/g, ''));
        if (amount < 100000) {
          suggestions.push('Consider if budget is sufficient for project scope');
          score = 60;
        } else if (amount > 10000000) {
          suggestions.push('Very high budget may require additional justification');
          score = 70;
        } else {
          score = 90;
        }
      }
      break;

    default:
      score = value.length > 50 ? 85 : 60;
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    score
  };
}

export function getFieldQualityIndicator(score: number): {
  color: string;
  icon: string;
  message: string;
} {
  if (score >= 85) {
    return { color: 'green', icon: '🏆', message: 'Excellent quality' };
  } else if (score >= 70) {
    return { color: 'blue', icon: '✅', message: 'Good quality' };
  } else if (score >= 50) {
    return { color: 'orange', icon: '⚠️', message: 'Needs improvement' };
  } else {
    return { color: 'red', icon: '❌', message: 'Critical issues' };
  }
}