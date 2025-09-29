/**
 * 🎯 ULTRATHINK: Intelligent Resource Optimization Engine
 * AI-driven budget allocation, timeline optimization, and resource planning
 * Based on project characteristics, municipality size, and IPA window requirements
 */

import { getMunicipalityProfile, type MunicipalityProfile } from './municipality-intelligence';

export interface ResourceOptimization {
  budget: BudgetOptimization;
  timeline: TimelineOptimization;
  personnel: PersonnelOptimization;
  risks: ResourceRisk[];
  recommendations: string[];
  confidence: number; // 0-1 confidence score
}

export interface BudgetOptimization {
  recommendedTotal: number;
  breakdown: BudgetBreakdown;
  coFinancingStructure: CoFinancingStructure;
  justification: string;
  alternatives: BudgetAlternative[];
}

export interface BudgetBreakdown {
  personnel: number;
  equipment: number;
  services: number;
  travel: number;
  infrastructure: number;
  other: number;
}

export interface CoFinancingStructure {
  euContribution: number; // percentage
  nationalContribution: number;
  municipalContribution: number;
  privateContribution?: number;
}

export interface BudgetAlternative {
  scenario: 'minimal' | 'standard' | 'enhanced';
  total: number;
  description: string;
  impact: string;
}

export interface TimelineOptimization {
  recommendedDuration: number; // months
  phases: ProjectPhase[];
  criticalPath: string[];
  seasonalConsiderations: string[];
  bufferTime: number; // percentage
}

export interface ProjectPhase {
  name: string;
  duration: number; // months
  startMonth: number;
  activities: string[];
  dependencies: string[];
  budget: number;
}

export interface PersonnelOptimization {
  totalPersonMonths: number;
  keyRoles: PersonnelRole[];
  skillsNeeded: string[];
  trainingBudget: number;
}

export interface PersonnelRole {
  role: string;
  personMonths: number;
  skillLevel: 'junior' | 'senior' | 'expert';
  cost: number;
}

export interface ResourceRisk {
  category: 'budget' | 'timeline' | 'personnel' | 'technical';
  risk: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

// 🚀 COMPREHENSIVE RESOURCE OPTIMIZATION ENGINE
export function optimizeProjectResources(
  projectContext: any,
  municipalityName: string,
  ipaWindow: string
): ResourceOptimization {
  const municipalityProfile = getMunicipalityProfile(municipalityName);
  const projectComplexity = analyzeProjectComplexity(projectContext);

  // Generate optimized resource allocation
  const budget = optimizeBudget(projectContext, municipalityProfile, ipaWindow, projectComplexity);
  const timeline = optimizeTimeline(projectContext, municipalityProfile, projectComplexity);
  const personnel = optimizePersonnel(projectContext, municipalityProfile, projectComplexity);
  const risks = identifyResourceRisks(projectContext, municipalityProfile, budget, timeline);
  const recommendations = generateResourceRecommendations(budget, timeline, personnel, municipalityProfile);

  // Calculate confidence score based on data availability and project clarity
  const confidence = calculateConfidence(projectContext, municipalityProfile, projectComplexity);

  return {
    budget,
    timeline,
    personnel,
    risks,
    recommendations,
    confidence
  };
}

// 📊 PROJECT COMPLEXITY ANALYSIS
function analyzeProjectComplexity(projectContext: any): {
  score: number; // 1-10
  level: 'simple' | 'moderate' | 'complex' | 'very_complex';
  factors: string[];
} {
  let score = 3; // Base score
  const factors: string[] = [];

  const content = `${projectContext.title} ${projectContext.description} ${projectContext.objectives}`.toLowerCase();

  // Technical complexity indicators
  const techKeywords = ['digital', 'smart', 'iot', 'ai', 'blockchain', 'system integration'];
  const techMatches = techKeywords.filter(keyword => content.includes(keyword));
  if (techMatches.length > 0) {
    score += Math.min(techMatches.length * 0.8, 2);
    factors.push(`Technical complexity: ${techMatches.join(', ')}`);
  }

  // Infrastructure complexity
  if (content.includes('infrastructure') || content.includes('construction')) {
    score += 1.5;
    factors.push('Infrastructure development required');
  }

  // Multi-stakeholder complexity
  const stakeholderKeywords = ['partnership', 'cooperation', 'cross-border', 'multi'];
  const stakeholderMatches = stakeholderKeywords.filter(keyword => content.includes(keyword));
  if (stakeholderMatches.length > 0) {
    score += 1;
    factors.push('Multi-stakeholder coordination required');
  }

  // Regulatory complexity
  if (content.includes('legal') || content.includes('regulation') || content.includes('compliance')) {
    score += 1;
    factors.push('Regulatory/legal complexity');
  }

  // Innovation level
  if (content.includes('innovative') || content.includes('pilot') || content.includes('first')) {
    score += 1.5;
    factors.push('Innovation/pilot project complexity');
  }

  score = Math.min(score, 10);

  const level = score <= 4 ? 'simple' :
                score <= 6 ? 'moderate' :
                score <= 8 ? 'complex' : 'very_complex';

  return { score, level, factors };
}

// 💰 BUDGET OPTIMIZATION
function optimizeBudget(
  projectContext: any,
  municipalityProfile: MunicipalityProfile | null,
  ipaWindow: string,
  complexity: { score: number; level: string; factors: string[] }
): BudgetOptimization {
  // Base budget calculation factors
  const populationSize = municipalityProfile?.population || 100000;
  const economicLevel = municipalityProfile?.economicProfile.gdpPerCapita || 6000;
  const complexityMultiplier = 1 + (complexity.score - 3) * 0.15;

  // IPA Window specific budget ranges (in EUR)
  const windowBudgetRanges = {
    window1: { min: 300000, max: 8000000, avg: 2000000 }, // Rule of Law
    window2: { min: 250000, max: 6000000, avg: 1500000 }, // Democracy
    window3: { min: 500000, max: 12000000, avg: 3000000 }, // Green Agenda
    window4: { min: 400000, max: 10000000, avg: 2500000 }, // Competitiveness
    window5: { min: 200000, max: 5000000, avg: 1200000 }  // Cooperation
  };

  const windowRange = windowBudgetRanges[ipaWindow as keyof typeof windowBudgetRanges] || windowBudgetRanges.window3;

  // Calculate recommended total based on multiple factors
  let baseAmount = windowRange.avg;

  // Adjust for population size
  if (populationSize > 500000) baseAmount *= 1.3;
  else if (populationSize < 50000) baseAmount *= 0.6;

  // Adjust for complexity
  baseAmount *= complexityMultiplier;

  // Adjust for economic level (higher GDP = higher budgets feasible)
  const economicAdjustment = Math.min(economicLevel / 7000, 1.4);
  baseAmount *= economicAdjustment;

  const recommendedTotal = Math.min(Math.max(baseAmount, windowRange.min), windowRange.max);

  // Generate budget breakdown based on IPA window and project type
  const breakdown = generateBudgetBreakdown(ipaWindow, recommendedTotal, complexity);

  // Co-financing structure based on municipality economic capacity
  const coFinancing = generateCoFinancingStructure(municipalityProfile, recommendedTotal);

  // Budget alternatives
  const alternatives: BudgetAlternative[] = [
    {
      scenario: 'minimal',
      total: recommendedTotal * 0.7,
      description: 'Focused on core objectives with reduced scope',
      impact: 'Limited reach but achievable with high success probability'
    },
    {
      scenario: 'standard',
      total: recommendedTotal,
      description: 'Balanced approach covering all main objectives',
      impact: 'Optimal balance of ambition and feasibility'
    },
    {
      scenario: 'enhanced',
      total: recommendedTotal * 1.4,
      description: 'Extended scope with innovation and regional impact',
      impact: 'Maximum impact potential with higher implementation complexity'
    }
  ];

  const justification = generateBudgetJustification(recommendedTotal, breakdown, municipalityProfile, ipaWindow);

  return {
    recommendedTotal: Math.round(recommendedTotal),
    breakdown,
    coFinancingStructure: coFinancing,
    justification,
    alternatives
  };
}

function generateBudgetBreakdown(ipaWindow: string, total: number, complexity: any): BudgetBreakdown {
  // IPA Window specific breakdown patterns
  const breakdownPatterns = {
    window1: { personnel: 0.35, equipment: 0.15, services: 0.25, travel: 0.05, infrastructure: 0.10, other: 0.10 },
    window2: { personnel: 0.40, equipment: 0.10, services: 0.30, travel: 0.08, infrastructure: 0.07, other: 0.05 },
    window3: { personnel: 0.25, equipment: 0.30, services: 0.20, travel: 0.03, infrastructure: 0.15, other: 0.07 },
    window4: { personnel: 0.30, equipment: 0.35, services: 0.20, travel: 0.05, infrastructure: 0.05, other: 0.05 },
    window5: { personnel: 0.35, equipment: 0.15, services: 0.25, travel: 0.15, infrastructure: 0.05, other: 0.05 }
  };

  const pattern = breakdownPatterns[ipaWindow as keyof typeof breakdownPatterns] || breakdownPatterns.window3;

  return {
    personnel: Math.round(total * pattern.personnel),
    equipment: Math.round(total * pattern.equipment),
    services: Math.round(total * pattern.services),
    travel: Math.round(total * pattern.travel),
    infrastructure: Math.round(total * pattern.infrastructure),
    other: Math.round(total * pattern.other)
  };
}

function generateCoFinancingStructure(municipalityProfile: MunicipalityProfile | null, total: number): CoFinancingStructure {
  // EU co-financing rates based on municipality capacity
  let euRate = 75; // Default rate

  if (municipalityProfile) {
    const gdpPerCapita = municipalityProfile.economicProfile.gdpPerCapita;
    const complianceLevel = municipalityProfile.governance.euComplianceLevel;

    // Adjust based on economic development level
    if (gdpPerCapita < 5000) euRate = 85; // Higher co-financing for less developed
    else if (gdpPerCapita > 8000) euRate = 65; // Lower co-financing for more developed

    // Adjust based on governance/compliance capacity
    if (complianceLevel < 5) euRate = Math.min(euRate + 5, 85); // Higher support for lower capacity
  }

  const nationalRate = Math.max(25 - euRate + 75, 10);
  const municipalRate = 100 - euRate - nationalRate;

  return {
    euContribution: euRate,
    nationalContribution: nationalRate,
    municipalContribution: Math.max(municipalRate, 5) // Minimum 5% municipal contribution
  };
}

// ⏱️ TIMELINE OPTIMIZATION
function optimizeTimeline(
  projectContext: any,
  municipalityProfile: MunicipalityProfile | null,
  complexity: { score: number; level: string }
): TimelineOptimization {
  // Base duration calculation
  let baseDuration = 24; // months

  // Adjust for complexity
  if (complexity.level === 'simple') baseDuration = 18;
  else if (complexity.level === 'complex') baseDuration = 30;
  else if (complexity.level === 'very_complex') baseDuration = 36;

  // Adjust for municipality capacity
  if (municipalityProfile) {
    const capacity = municipalityProfile.governance.euComplianceLevel;
    if (capacity < 5) baseDuration += 6; // More time needed for lower capacity
    else if (capacity > 7) baseDuration -= 3; // Less time needed for higher capacity
  }

  const recommendedDuration = Math.min(Math.max(baseDuration, 12), 48);

  // Generate project phases
  const phases = generateProjectPhases(recommendedDuration, complexity);

  // Critical path activities
  const criticalPath = [
    'Project setup and partnership agreements',
    'Procurement processes',
    'Core implementation activities',
    'Quality assurance and testing',
    'Final evaluation and reporting'
  ];

  // Seasonal considerations
  const seasonalConsiderations = [
    'Summer months may affect staff availability',
    'End-of-year budget cycles may impact procurement',
    'Holiday periods require activity planning adjustments'
  ];

  return {
    recommendedDuration,
    phases,
    criticalPath,
    seasonalConsiderations,
    bufferTime: 15 // 15% buffer recommended
  };
}

function generateProjectPhases(duration: number, complexity: any): ProjectPhase[] {
  const phases: ProjectPhase[] = [];

  // Phase 1: Setup and Planning
  const setupDuration = Math.round(duration * 0.2);
  phases.push({
    name: 'Project Setup & Planning',
    duration: setupDuration,
    startMonth: 1,
    activities: [
      'Project team establishment',
      'Stakeholder engagement',
      'Detailed planning and design',
      'Procurement preparation',
      'Baseline studies'
    ],
    dependencies: [],
    budget: 0.15 // 15% of total budget
  });

  // Phase 2: Implementation
  const implDuration = Math.round(duration * 0.6);
  phases.push({
    name: 'Core Implementation',
    duration: implDuration,
    startMonth: setupDuration + 1,
    activities: [
      'Main project activities execution',
      'Infrastructure development',
      'Capacity building programs',
      'System deployment',
      'Continuous monitoring'
    ],
    dependencies: ['Project Setup & Planning'],
    budget: 0.70 // 70% of total budget
  });

  // Phase 3: Finalization
  const finalDuration = duration - setupDuration - implDuration;
  phases.push({
    name: 'Finalization & Evaluation',
    duration: finalDuration,
    startMonth: setupDuration + implDuration + 1,
    activities: [
      'Final testing and quality assurance',
      'Impact evaluation',
      'Sustainability planning',
      'Knowledge transfer',
      'Final reporting'
    ],
    dependencies: ['Core Implementation'],
    budget: 0.15 // 15% of total budget
  });

  return phases;
}

// 👥 PERSONNEL OPTIMIZATION
function optimizePersonnel(
  projectContext: any,
  municipalityProfile: MunicipalityProfile | null,
  complexity: { score: number; level: string }
): PersonnelOptimization {
  // Calculate total person-months based on budget and complexity
  const basePersonMonths = complexity.score * 8; // Base calculation

  // Adjust for municipality size
  let adjustment = 1;
  if (municipalityProfile) {
    if (municipalityProfile.population > 200000) adjustment = 1.2;
    else if (municipalityProfile.population < 50000) adjustment = 0.8;
  }

  const totalPersonMonths = Math.round(basePersonMonths * adjustment);

  // Define key roles based on project requirements
  const keyRoles: PersonnelRole[] = [
    {
      role: 'Project Manager',
      personMonths: Math.round(totalPersonMonths * 0.2),
      skillLevel: 'expert',
      cost: 4500 // EUR per month
    },
    {
      role: 'Technical Expert',
      personMonths: Math.round(totalPersonMonths * 0.3),
      skillLevel: 'senior',
      cost: 3500
    },
    {
      role: 'Municipal Liaison',
      personMonths: Math.round(totalPersonMonths * 0.15),
      skillLevel: 'senior',
      cost: 2800
    },
    {
      role: 'Administrative Support',
      personMonths: Math.round(totalPersonMonths * 0.2),
      skillLevel: 'junior',
      cost: 2000
    },
    {
      role: 'Specialist Consultant',
      personMonths: Math.round(totalPersonMonths * 0.15),
      skillLevel: 'expert',
      cost: 5000
    }
  ];

  // Skills needed based on project context and IPA window
  const skillsNeeded = [
    'EU project management',
    'Stakeholder engagement',
    'Technical implementation',
    'Monitoring and evaluation',
    'Financial management',
    'Communication and dissemination'
  ];

  const trainingBudget = totalPersonMonths * 500; // EUR 500 per person-month for capacity building

  return {
    totalPersonMonths,
    keyRoles,
    skillsNeeded,
    trainingBudget
  };
}

// 🚨 RESOURCE RISK IDENTIFICATION
function identifyResourceRisks(
  projectContext: any,
  municipalityProfile: MunicipalityProfile | null,
  budget: BudgetOptimization,
  timeline: TimelineOptimization
): ResourceRisk[] {
  const risks: ResourceRisk[] = [];

  // Budget risks
  if (budget.recommendedTotal > 2000000) {
    risks.push({
      category: 'budget',
      risk: 'High budget may face procurement complexity',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Prepare detailed procurement plan with EU compliance expertise'
    });
  }

  if (municipalityProfile && budget.coFinancingStructure.municipalContribution > 15) {
    risks.push({
      category: 'budget',
      risk: 'Municipal co-financing capacity may be limited',
      probability: 'medium',
      impact: 'medium',
      mitigation: 'Secure municipal commitment and explore alternative financing sources'
    });
  }

  // Timeline risks
  if (timeline.recommendedDuration > 30) {
    risks.push({
      category: 'timeline',
      risk: 'Extended timeline increases implementation risks',
      probability: 'medium',
      impact: 'medium',
      mitigation: 'Implement robust project management and regular milestone reviews'
    });
  }

  // Municipal capacity risks
  if (municipalityProfile && municipalityProfile.governance.euComplianceLevel < 6) {
    risks.push({
      category: 'personnel',
      risk: 'Limited municipal EU project experience',
      probability: 'high',
      impact: 'medium',
      mitigation: 'Include extensive capacity building and external technical assistance'
    });
  }

  return risks;
}

// 📋 RESOURCE RECOMMENDATIONS
function generateResourceRecommendations(
  budget: BudgetOptimization,
  timeline: TimelineOptimization,
  personnel: PersonnelOptimization,
  municipalityProfile: MunicipalityProfile | null
): string[] {
  const recommendations: string[] = [];

  // Budget recommendations
  if (budget.recommendedTotal > 1000000) {
    recommendations.push('💰 Consider phased implementation approach to manage large budget effectively');
  }

  // Timeline recommendations
  if (timeline.recommendedDuration > 24) {
    recommendations.push('⏱️ Plan for extended timeline with interim milestones and regular reviews');
  }

  // Personnel recommendations
  if (personnel.totalPersonMonths > 50) {
    recommendations.push('👥 Establish strong project management structure with clear role definitions');
  }

  // Municipality-specific recommendations
  if (municipalityProfile) {
    if (municipalityProfile.governance.euComplianceLevel < 6) {
      recommendations.push('📚 Prioritize capacity building and EU compliance training for municipal staff');
    }

    if (municipalityProfile.economicProfile.gdpPerCapita < 6000) {
      recommendations.push('🤝 Leverage higher EU co-financing rates and seek additional support mechanisms');
    }
  }

  // General optimization recommendations
  recommendations.push('🎯 Align resource allocation with IPA III assessment criteria for maximum scoring');
  recommendations.push('📊 Implement robust monitoring system to track resource utilization and outcomes');

  return recommendations;
}

// 🎯 CONFIDENCE CALCULATION
function calculateConfidence(
  projectContext: any,
  municipalityProfile: MunicipalityProfile | null,
  complexity: { score: number; level: string }
): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence based on available data
  if (projectContext.title && projectContext.description) confidence += 0.2;
  if (municipalityProfile) confidence += 0.15;
  if (projectContext.budget && projectContext.duration) confidence += 0.1;
  if (projectContext.objectives) confidence += 0.05;

  // Adjust based on complexity (simpler projects have higher confidence)
  if (complexity.level === 'simple') confidence += 0.1;
  else if (complexity.level === 'very_complex') confidence -= 0.05;

  return Math.min(confidence, 0.95); // Cap at 95%
}

function generateBudgetJustification(
  total: number,
  breakdown: BudgetBreakdown,
  municipalityProfile: MunicipalityProfile | null,
  ipaWindow: string
): string {
  const municipalityInfo = municipalityProfile ?
    `for ${municipalityProfile.name} (population: ${municipalityProfile.population.toLocaleString()})` :
    'for this municipality';

  return `Budget of €${total.toLocaleString()} is optimized ${municipalityInfo} based on IPA III ${ipaWindow} requirements.
Allocation prioritizes personnel (${Math.round((breakdown.personnel/total)*100)}%) and equipment/services (${Math.round(((breakdown.equipment+breakdown.services)/total)*100)}%)
to ensure effective implementation while maintaining cost-efficiency standards for municipal-level EU projects.`;
}