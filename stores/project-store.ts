import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { performComprehensiveAssessment, calculateClimateContribution } from '../lib/performance-assessment'

interface SmartObjectives {
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timeBound: string
}

type ComplianceSectionId =
  | 'basicInfo'
  | 'strategicAlignment'
  | 'implementation'
  | 'riskSustainability'
  | 'budgetTimeline'

interface ComplianceItemEvaluation {
  met: boolean
  detail?: string
  guidance?: string
  currentValue?: number | string
}

interface ComplianceItemDefinition {
  id: string
  label: string
  evaluate: (project: Project) => ComplianceItemEvaluation
}

interface ComplianceSectionDefinition {
  id: ComplianceSectionId
  label: string
  weight: number // 0-1
  threshold: number // 0-100
  items: ComplianceItemDefinition[]
}

interface ComplianceSectionResult {
  id: ComplianceSectionId
  label: string
  weight: number
  threshold: number
  percentage: number
  weightedScore: number
  meetsThreshold: boolean
  items: (ComplianceItemDefinition & ComplianceItemEvaluation & { score: number })[]
}

interface ComplianceMetrics {
  total: number
  window: string
  windowLabel: string
  windowThreshold: number
  meetsWindowThreshold: boolean
  sections: ComplianceSectionResult[]
}

interface ComplianceProfile {
  window: string
  windowLabel: string
  windowThreshold: number
  sectionOverrides?: Partial<Record<ComplianceSectionId, Partial<Pick<ComplianceSectionDefinition, 'weight' | 'threshold'>>>>
}

interface Project {
  id?: string
  title: string
  municipality: string
  country: string
  ipaWindow: string
  budget: string
  duration: string
  description: string
  objectives: string
  methodology: string
  smartObjectives: SmartObjectives
  risks: string
  sustainability: string
  mode: 'template' | 'custom'
  language: string
  complianceScore: number
  complianceBreakdown: ComplianceMetrics
  status: 'draft' | 'submitted'

  // IPA III Performance Assessment Fields
  relevanceScore?: number
  maturityScore?: number
  performanceScore?: number
  climateContribution?: number
  performanceIndicators?: string
  crossCuttingPriorities?: string
  totalBudget?: number
  euContribution?: number
  partnerContribution?: number
  leadPartner?: string
  partners?: string
  activities?: string
  deliverables?: string
  timeline?: string
  milestones?: string
  monitoringPlan?: string
  evaluationApproach?: string
}

interface AIFeedback {
  field: string
  isLoading: boolean
  isSuccess: boolean
  animation: 'idle' | 'loading' | 'success' | 'error'
}

interface ProjectStore {
  project: Project
  aiFeedback: Record<string, AIFeedback>
  projectId: string | null
  isAutoSaving: boolean
  lastSaved: Date | null

  // Actions
  updateField: (field: keyof Project | string, value: any) => void
  updateSmartObjective: (key: keyof SmartObjectives, value: string) => void
  setProject: (project: Partial<Project>) => void
  setProjectId: (id: string) => void
  setAIFeedback: (field: string, feedback: Partial<AIFeedback>) => void
  resetAIFeedback: (field: string) => void
  setAutoSaving: (saving: boolean) => void
  calculateCompliance: () => ComplianceMetrics
  calculatePerformanceScore: () => any
  getClimateContribution: () => number
  getPerformanceMetrics: () => any
  getFilledFields: () => string[]
  getProjectContext: () => string
}

const initialProject: Project = {
  title: '',
  municipality: '',
  country: '',
  ipaWindow: '',
  budget: '',
  duration: '',
  description: '',
  objectives: '',
  methodology: '',
  smartObjectives: {
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: ''
  },
  risks: '',
  sustainability: '',
  mode: 'template',
  language: 'en',
  complianceScore: 0,
  complianceBreakdown: {
    total: 0,
    window: 'default',
    windowLabel: 'General IPA Alignment',
    windowThreshold: 70,
    meetsWindowThreshold: false,
    sections: []
  },
  status: 'draft'
}

const baseSectionDefinitions: Record<ComplianceSectionId, ComplianceSectionDefinition> = {
  basicInfo: {
    id: 'basicInfo',
    label: 'Basic Information',
    weight: 0.2,
    threshold: 60,
    items: [
      {
        id: 'title',
        label: 'Project title is descriptive (≥ 10 characters)',
        evaluate: (project) => {
          const length = project.title?.trim().length || 0
          return {
            met: length >= 10,
            detail: `${length} characters`,
            guidance: 'Provide a descriptive title with at least 10 characters.'
          }
        }
      },
      {
        id: 'municipality',
        label: 'Municipality selected',
        evaluate: (project) => ({
          met: Boolean(project.municipality?.trim()),
          guidance: 'Specify the implementing municipality.'
        })
      },
      {
        id: 'country',
        label: 'Country selected',
        evaluate: (project) => ({
          met: Boolean(project.country?.trim()),
          guidance: 'Select the project country to confirm eligibility.'
        })
      },
      {
        id: 'ipaWindow',
        label: 'IPA III window selected',
        evaluate: (project) => ({
          met: Boolean(project.ipaWindow?.trim()),
          guidance: 'Choose the primary IPA III window for alignment.'
        })
      }
    ]
  },
  strategicAlignment: {
    id: 'strategicAlignment',
    label: 'Strategic Alignment',
    weight: 0.25,
    threshold: 65,
    items: [
      {
        id: 'description-depth',
        label: 'Project description depth (≥ 250 characters)',
        evaluate: (project) => {
          const length = project.description?.trim().length || 0
          return {
            met: length >= 250,
            detail: `${length} characters`,
            guidance: 'Expand the project description to at least 250 characters to cover context and rationale.'
          }
        }
      },
      {
        id: 'objectives-depth',
        label: 'Objectives cover EU alignment (≥ 200 characters)',
        evaluate: (project) => {
          const length = project.objectives?.trim().length || 0
          return {
            met: length >= 200,
            detail: `${length} characters`,
            guidance: 'Elaborate objectives with at least 200 characters referencing IPA priorities.'
          }
        }
      }
    ]
  },
  implementation: {
    id: 'implementation',
    label: 'Implementation & SMART Logic',
    weight: 0.25,
    threshold: 70,
    items: [
      {
        id: 'methodology-depth',
        label: 'Implementation methodology detailed (≥ 220 characters)',
        evaluate: (project) => {
          const length = project.methodology?.trim().length || 0
          return {
            met: length >= 220,
            detail: `${length} characters`,
            guidance: 'Describe methodology with at least 220 characters covering phases and partners.'
          }
        }
      },
      {
        id: 'smart-coverage',
        label: 'SMART objectives mostly completed (≥ 4 entries ≥ 80 characters)',
        evaluate: (project) => {
          const filled = Object.values(project.smartObjectives || {}).filter(value => (value?.trim().length || 0) >= 80).length
          return {
            met: filled >= 4,
            detail: `${filled} SMART elements ≥ 80 chars`,
            guidance: 'Ensure at least four SMART statements have 80+ characters explaining the target.'
          }
        }
      }
    ]
  },
  riskSustainability: {
    id: 'riskSustainability',
    label: 'Risk & Sustainability',
    weight: 0.15,
    threshold: 60,
    items: [
      {
        id: 'risks-depth',
        label: 'Risk mitigation analysed (≥ 180 characters)',
        evaluate: (project) => {
          const length = project.risks?.trim().length || 0
          return {
            met: length >= 180,
            detail: `${length} characters`,
            guidance: 'Provide at least 180 characters on key risks and mitigations.'
          }
        }
      },
      {
        id: 'sustainability-depth',
        label: 'Sustainability plan detailed (≥ 180 characters)',
        evaluate: (project) => {
          const length = project.sustainability?.trim().length || 0
          return {
            met: length >= 180,
            detail: `${length} characters`,
            guidance: 'Detail sustainability actions with at least 180 characters.'
          }
        }
      }
    ]
  },
  budgetTimeline: {
    id: 'budgetTimeline',
    label: 'Budget & Timeline',
    weight: 0.15,
    threshold: 55,
    items: [
      {
        id: 'budget-range',
        label: 'Budget defined and within EU co-financing limits',
        evaluate: (project) => {
          const amount = parseInt(project.budget || '0', 10)
          const met = Number.isFinite(amount) && amount > 0 && amount <= 10500000
          return {
            met,
            detail: met ? `€${amount.toLocaleString()}` : 'Budget missing or out of range',
            guidance: 'Enter a total budget (≤ €10.5m) to match IPA co-financing expectations.',
            currentValue: amount
          }
        }
      },
      {
        id: 'duration-defined',
        label: 'Project duration specified (≥ 6 months)',
        evaluate: (project) => {
          const duration = parseInt(project.duration || '0', 10)
          return {
            met: Number.isFinite(duration) && duration >= 6,
            detail: duration ? `${duration} months` : 'Not provided',
            guidance: 'Define a project duration of at least 6 months to fulfil IPA design norms.',
            currentValue: duration
          }
        }
      }
    ]
  }
}

const complianceProfiles: Record<string, ComplianceProfile> = {
  default: {
    window: 'default',
    windowLabel: 'General IPA Alignment',
    windowThreshold: 70
  },
  window1: {
    window: 'window1',
    windowLabel: 'Rule of Law & Fundamental Rights',
    windowThreshold: 82,
    sectionOverrides: {
      implementation: { threshold: 75 },
      riskSustainability: { weight: 0.2, threshold: 70 }
    }
  },
  window2: {
    window: 'window2',
    windowLabel: 'Democracy, Governance & Public Administration',
    windowThreshold: 78,
    sectionOverrides: {
      strategicAlignment: { weight: 0.3, threshold: 70 }
    }
  },
  window3: {
    window: 'window3',
    windowLabel: 'Green Agenda & Sustainable Connectivity',
    windowThreshold: 76,
    sectionOverrides: {
      riskSustainability: { weight: 0.2, threshold: 72 }
    }
  },
  window4: {
    window: 'window4',
    windowLabel: 'Competitiveness & Innovation',
    windowThreshold: 77,
    sectionOverrides: {
      implementation: { weight: 0.28 },
      strategicAlignment: { threshold: 68 }
    }
  },
  window5: {
    window: 'window5',
    windowLabel: 'Territorial Cooperation & Good Neighbourly Relations',
    windowThreshold: 74,
    sectionOverrides: {
      basicInfo: { threshold: 65 },
      implementation: { threshold: 68 }
    }
  }
}

function getComplianceProfile(window: string): ComplianceProfile {
  if (!window) {
    return complianceProfiles.default
  }
  return complianceProfiles[window] ?? complianceProfiles.default
}

function buildSectionDefinitions(window: string): ComplianceSectionDefinition[] {
  const profile = getComplianceProfile(window)
  const definitions = Object.values(baseSectionDefinitions).map(section => {
    const overrides = profile.sectionOverrides?.[section.id]
    const weight = overrides?.weight ?? section.weight
    const threshold = overrides?.threshold ?? section.threshold
    return { ...section, weight, threshold }
  })

  const totalWeight = definitions.reduce((sum, section) => sum + section.weight, 0)
  if (totalWeight <= 0) {
    return definitions
  }

  return definitions.map(section => ({
    ...section,
    weight: section.weight / totalWeight
  }))
}

function computeCompliance(project: Project): ComplianceMetrics {
  const activeWindow = project.ipaWindow || 'window3'
  const profile = getComplianceProfile(activeWindow)
  const sections = buildSectionDefinitions(activeWindow).map(section => {
    const itemWeight = section.items.length > 0 ? 100 / section.items.length : 0
    const evaluatedItems = section.items.map(item => {
      const evaluation = item.evaluate(project)
      return {
        ...item,
        ...evaluation,
        score: evaluation.met ? itemWeight : 0
      }
    })

    const completedShare = evaluatedItems.reduce((sum, item) => sum + (item.met ? 1 : 0), 0) / (section.items.length || 1)
    const percentage = Math.round(completedShare * 100)
    const weightedScore = Math.round((percentage / 100) * section.weight * 100)

    return {
      id: section.id,
      label: section.label,
      weight: section.weight,
      threshold: section.threshold,
      percentage,
      weightedScore,
      meetsThreshold: percentage >= section.threshold,
      items: evaluatedItems
    }
  })

  const total = Math.min(100, Math.round(sections.reduce((sum, section) => sum + section.weightedScore, 0)))
  const meetsWindowThreshold = total >= profile.windowThreshold

  return {
    total,
    window: profile.window,
    windowLabel: profile.windowLabel,
    windowThreshold: profile.windowThreshold,
    meetsWindowThreshold,
    sections
  }
}

function applyCompliance(project: Project): Project {
  const metrics = computeCompliance(project)
  return {
    ...project,
    complianceScore: metrics.total,
    complianceBreakdown: metrics
  }
}

const projectWithCompliance = applyCompliance(initialProject)

const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      project: projectWithCompliance,
      aiFeedback: {},
      projectId: null,
      isAutoSaving: false,
      lastSaved: null,

      updateField: (field, value) => {
        set((state) => {
          const updatedProject = applyCompliance({
            ...state.project,
            [field]: value
          })

          return { project: updatedProject }
        })
      },

      updateSmartObjective: (key, value) => {
        set((state) => {
          const updatedProject = applyCompliance({
            ...state.project,
            smartObjectives: {
              ...state.project.smartObjectives,
              [key]: value
            }
          })

          return { project: updatedProject }
        })
      },

      setProject: (newProject) => {
        set((state) => {
          const mergedProject = {
            ...state.project,
            ...newProject
          }

          return { project: applyCompliance(mergedProject) }
        })
      },

      setProjectId: (id) => set({ projectId: id }),

      setAIFeedback: (field, feedback) => {
        set((state) => ({
          aiFeedback: {
            ...state.aiFeedback,
            [field]: {
              ...state.aiFeedback[field],
              ...feedback
            }
          }
        }))
      },

      resetAIFeedback: (field) => {
        set((state) => ({
          aiFeedback: {
            ...state.aiFeedback,
            [field]: {
              field,
              isLoading: false,
              isSuccess: false,
              animation: 'idle'
            }
          }
        }))
      },

      setAutoSaving: (saving) => set({ isAutoSaving: saving }),

      calculateCompliance: () => get().project.complianceBreakdown,

      // New IPA III Performance Assessment Methods
      calculatePerformanceScore: () => {
        const { project } = get()
        const assessment = performComprehensiveAssessment(project)

        // Update project with performance scores
        set((state) => ({
          project: {
            ...state.project,
            relevanceScore: assessment.relevanceScore,
            maturityScore: assessment.maturityScore,
            performanceScore: assessment.performanceScore,
            climateContribution: assessment.climateContribution,
            performanceIndicators: JSON.stringify(assessment.indicators),
            crossCuttingPriorities: JSON.stringify(assessment.crossCuttingPriorities)
          }
        }))

        return assessment
      },

      getClimateContribution: () => {
        const { project } = get()
        return calculateClimateContribution(project)
      },

      getPerformanceMetrics: () => {
        const { project } = get()
        return {
          relevance: project.relevanceScore || 0,
          maturity: project.maturityScore || 0,
          performance: project.performanceScore || 0,
          climate: project.climateContribution || 0,
          meetsRelevance: (project.relevanceScore || 0) >= 65,
          meetsMaturity: (project.maturityScore || 0) >= 60,
          meetsClimate: (project.climateContribution || 0) >= 18,
          overallCompliant: (project.relevanceScore || 0) >= 65 && (project.maturityScore || 0) >= 60
        }
      },

      getFilledFields: () => {
        const { project } = get()
        const filled: string[] = []

        Object.entries(project).forEach(([key, value]) => {
          if (typeof value === 'string' && value.length > 0) {
            filled.push(key)
          } else if (key === 'smartObjectives' && typeof value === 'object') {
            Object.entries(value).forEach(([smartKey, smartValue]) => {
              if (smartValue && typeof smartValue === 'string' && smartValue.length > 0) {
                filled.push(`smart_${smartKey}`)
              }
            })
          }
        })

        return filled
      },

      getProjectContext: () => {
        const { project } = get()
        const filledFields = get().getFilledFields()

        let context = 'Project Context:\n'

        if (project.title) context += `Title: ${project.title}\n`
        if (project.municipality) context += `Municipality: ${project.municipality}\n`
        if (project.country) context += `Country: ${project.country}\n`
        if (project.ipaWindow) context += `IPA Window: ${project.ipaWindow}\n`
        if (project.description) context += `\nDescription Summary: ${project.description.substring(0, 200)}...\n`
        if (project.objectives) context += `\nObjectives Summary: ${project.objectives.substring(0, 200)}...\n`

        context += `\nFilled sections: ${filledFields.join(', ')}\n`
        context += `Compliance Score: ${project.complianceBreakdown.total}%\n`

        return context
      }
    }),
    {
      name: 'mefa-project-store'
    }
  )
)

export default useProjectStore