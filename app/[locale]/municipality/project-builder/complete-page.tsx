"use client"

import React, { useEffect, useState } from 'react'
import useProjectStore from '@/stores/project-store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AIFillButton, AutoCompleteButton } from '@/components/ai-fill-button'
import {
  FileText, Building2, Target, Euro, CheckCircle, Sparkles,
  Save, Zap, Globe, Loader2, MapPin, Flag, Briefcase, Clock,
  TrendingUp, Shield, Users, Award, ChevronRight, AlertTriangle, RotateCcw
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    sq: 'Albanian',
    bs: 'Bosnian',
    hr: 'Croatian',
    mk: 'Macedonian',
    me: 'Montenegrin',
    sr: 'Serbian',
    tr: 'Turkish'
  }
  return languages[code] || 'English'
}

// Format text with proper line breaks
function formatText(text: string): string {
  if (!text) return ''
  // Replace newlines with proper breaks and format lists
  return text
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
    .replace(/(\d+\.)\s/g, '<br/>$1 ')
}

export default function CompleteProjectBuilder() {
  const {
    project,
    updateField,
    updateSmartObjective,
    setProjectId,
    setAutoSaving,
    calculateCompliance,
    getProjectContext,
    isAutoSaving
  } = useProjectStore()

  const [projectId, setLocalProjectId] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiField, setAiField] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Get current language for translations
  const locale = useLocale()
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const saveTimer = setTimeout(async () => {
      if (!(project.title || project.municipality)) {
        return
      }

      setAutoSaving(true)
      setSaveError(null)
      try {
        const response = await fetch('/api/projects', {
          method: projectId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...project, id: projectId })
        })
        if (response.ok) {
          const data = await response.json()
          if (!projectId) {
            setLocalProjectId(data.id)
            setProjectId(data.id)
          }
          setLastSaved(new Date())
        } else {
          setSaveError('Failed to save')
        }
      } catch (error) {
        setSaveError('Connection error')
      } finally {
        setAutoSaving(false)
      }
    }, 2000)

    return () => clearTimeout(saveTimer)
  }, [project, projectId, setAutoSaving, setProjectId])

  const compliance = calculateCompliance()
  const complianceScore = compliance.total
  const meetsWindowThreshold = compliance.meetsWindowThreshold
  const cautionThreshold = Math.max(0, compliance.windowThreshold - 10)
  const sectionsNeedingAttention = compliance.sections.filter((section) => !section.meetsThreshold)
  const displayedCompliance = mounted ? complianceScore : 0
  const complianceStrokeColor = mounted
    ? (meetsWindowThreshold ? '#10b981' : complianceScore >= cautionThreshold ? '#f59e0b' : '#ef4444')
    : '#e5e7eb'
  const complianceProgressStroke = mounted ? `${(complianceScore / 100) * 126} 126` : '0 126'

  const handleAIFill = (field: string) => async (value: string) => {
    // Clean up the value if it contains formatting
    const cleanValue = value.replace(/<br\/>/g, '\n')
    updateField(field, cleanValue)

    const element = document.querySelector(`[data-field="${field}"]`)
    if (element) {
      element.classList.add('animate-highlight-green')
      setTimeout(() => element.classList.remove('animate-highlight-green'), 1000)
    }
  }

  const handleSmartAIFill = (field: string) => async (value: string) => {
    const cleanValue = value.replace(/<br\/>/g, '\n')
    updateSmartObjective(field as any, cleanValue)

    const element = document.querySelector(`[data-field="smart-${field}"]`)
    if (element) {
      element.classList.add('animate-highlight-green')
      setTimeout(() => element.classList.remove('animate-highlight-green'), 1000)
    }
  }

  const handleLocaleChange = (value: string) => {
    updateField('language', value)

    if (value !== locale) {
      const segments = pathname.split('/')
      if (segments.length > 1) {
        segments[1] = value
      }
      const newPath = segments.join('/') || '/'
      const query = searchParams.toString()
      router.push(query ? `${newPath}?${query}` : newPath)
    }
  }

  const resetGeneratedContent = () => {
    // Reset all project fields to initial state
    const emptyProject = {
      projectTitle: '',
      projectDescription: '',
      objectives: '',
      expectedResults: '',
      targetGroups: '',
      activities: '',
      budget: '',
      timeline: '',
      sustainability: '',
      risks: '',
      partnerships: '',
      monitoring: ''
    }

    Object.entries(emptyProject).forEach(([key, value]) => {
      updateField(key as keyof typeof emptyProject, value)
    })

    setShowSuccess(false)
    setSaveError(null)
  }

  const handleAutoComplete = async () => {
    setAiGenerating(true)
    setAiField('Initializing...')

    try {
      // Define all fields to be filled in order
      const allFields = [
        'description',
        'objectives',
        'methodology',
        'risks',
        'sustainability',
        'smartSpecific',
        'smartMeasurable',
        'smartAchievable',
        'smartRelevant',
        'smartTimeBound'
      ]

      const fieldLabels: Record<string, string> = {
        description: 'Project Description',
        objectives: 'General Objectives',
        methodology: 'Methodology',
        risks: 'Risk Assessment',
        sustainability: 'Sustainability Plan',
        smartSpecific: 'SMART Specific',
        smartMeasurable: 'SMART Measurable',
        smartAchievable: 'SMART Achievable',
        smartRelevant: 'SMART Relevant',
        smartTimeBound: 'SMART Time-bound'
      }

      let generatedContent: Record<string, string> = {}

      // Fill each field sequentially
      for (let i = 0; i < allFields.length; i++) {
        const field = allFields[i]
        const progress = Math.round(((i + 1) / allFields.length) * 100)
        setAiField(`Generating ${fieldLabels[field]} (${progress}%)`)

        try {
          const response = await fetch('/api/ai-assist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              field,
              context: {
                ...project,
                ...generatedContent // Include previously generated content as context
              },
              language: project.language || 'en',
              projectId
            })
          })

          if (response.ok) {
            const data = await response.json()
            generatedContent[field] = data.suggestion

            // Update the form field immediately
            if (field.startsWith('smart')) {
              // Convert smartSpecific -> specific, smartMeasurable -> measurable, etc.
              const smartKey = field.replace('smart', '').charAt(0).toLowerCase() + field.replace('smart', '').slice(1)
              updateSmartObjective(smartKey as any, data.suggestion)

              // Visual feedback for SMART fields
              const smartFieldName = field.replace('smart', '').toLowerCase()
              const element = document.querySelector(`[data-field="smart-${smartFieldName}"]`)
              if (element) {
                element.classList.add(data.source === 'error' ? 'animate-highlight-orange' : 'animate-highlight-green')
                setTimeout(() => {
                  element.classList.remove('animate-highlight-orange', 'animate-highlight-green')
                }, 1000)
              }
            } else {
              updateField(field, data.suggestion)

              // Visual feedback for regular fields
              const element = document.querySelector(`[data-field="${field}"]`)
              if (element) {
                element.classList.add(data.source === 'error' ? 'animate-highlight-orange' : 'animate-highlight-green')
                setTimeout(() => {
                  element.classList.remove('animate-highlight-orange', 'animate-highlight-green')
                }, 1000)
              }
            }
          }
        } catch (error) {
          console.error(`Error generating ${field}:`, error)
        }

        // Small delay between fields
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      setAiField('Complete!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)

    } catch (error) {
      console.error('Auto-complete error:', error)
      setAiField('Error occurred')
    }

    setTimeout(() => {
      setAiGenerating(false)
      setAiField(null)
    }, 2000)
  }

  const tabIcons = {
    basic: <FileText className="w-4 h-4" />,
    objectives: <Target className="w-4 h-4" />,
    methodology: <Briefcase className="w-4 h-4" />,
    budget: <Euro className="w-4 h-4" />,
    review: <CheckCircle className="w-4 h-4" />
  }

  const getTabName = (key: string) => {
    const mapping: Record<string, string> = {
      basic: t('tabs.basic'),
      objectives: t('tabs.objectives'),
      methodology: t('tabs.methodology'),
      budget: t('tabs.budget'),
      review: t('tabs.review')
    }
    return mapping[key] || key
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* AI Loading Overlay */}
      {aiGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl p-8 max-w-md shadow-2xl">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Sparkles className="h-12 w-12 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold">AI is generating content</h3>
              <p className="text-sm text-gray-600 text-center">
                {aiField ? `Working on: ${aiField}` : 'Please wait...'}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
                  <p className="text-xs text-gray-500">{t('subtitle')}</p>
                </div>
              </div>

              {/* Save Status */}
              {(isAutoSaving || lastSaved) && (
                <div className="flex items-center space-x-2 text-sm">
                  {isAutoSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      <span className="text-gray-600">{t('common.loading')}</span>
                    </>
                  ) : saveError ? (
                    <span className="text-red-500">⚠ {saveError}</span>
                  ) : lastSaved ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-gray-600">{t('review.saveProgress')}</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => updateField('mode', 'template')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    project.mode === 'template'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Template
                </button>
                <button
                  onClick={() => updateField('mode', 'custom')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    project.mode === 'custom'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Language & Reset */}
              <div className="flex items-center space-x-3">
                <Select
                  value={project.language || locale}
                  onValueChange={handleLocaleChange}
                >
                  <SelectTrigger className="w-36 h-9 text-sm">
                    <Globe className="w-3 h-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sq">Shqip (Albanian)</SelectItem>
                    <SelectItem value="bs">Bosanski (Bosnian)</SelectItem>
                    <SelectItem value="hr">Hrvatski (Croatian)</SelectItem>
                    <SelectItem value="mk">Македонски (Macedonian)</SelectItem>
                    <SelectItem value="me">Crnogorski (Montenegrin)</SelectItem>
                    <SelectItem value="sr">Српски (Serbian)</SelectItem>
                    <SelectItem value="tr">Türkçe (Turkish)</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={resetGeneratedContent}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('reset')}
                </Button>
              </div>

              {/* Compliance Score */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{displayedCompliance}%</p>
                  <p className="text-xs text-gray-500">{t('review.complianceScore')}</p>
                </div>
                <div className="w-12 h-12 relative">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="#e5e7eb"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke={complianceStrokeColor}
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={complianceProgressStroke}
                      className="transition-all duration-500"
                    />
                  </svg>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleAutoComplete}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Zap className="w-4 h-4 mr-2" />
                {t('basic.generateAI')}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={displayedCompliance} className="h-1 bg-gray-200" />
          </div>

          <div className="mt-4 rounded-xl border border-blue-100 bg-white/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{compliance.windowLabel}</span>
              <span>
                {t('review.thresholdTarget', { value: compliance.windowThreshold })} • {meetsWindowThreshold ? t('review.thresholdMet') : t('review.thresholdPending')}
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {compliance.sections.map((section) => {
                const weightPercent = Math.round(section.weight * 100)
                const cardAccent = section.meetsThreshold ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'

                return (
                  <div key={section.id} className={`rounded-lg border p-4 ${cardAccent}`}>
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{section.label}</span>
                      <span>{section.percentage}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/60">
                      <div
                        className={`${section.meetsThreshold ? 'bg-green-500' : 'bg-amber-500'} h-full`}
                        style={{ width: `${section.percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-600">
                      Weight {weightPercent}% • Target ≥ {section.threshold}%
                    </p>
                    {!section.meetsThreshold && (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {section.items
                          .filter((item) => !item.met)
                          .map((item) => (
                            <li key={item.id} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{item.guidance}</span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">Content generated successfully!</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="flex w-full h-16 px-6">
                {Object.entries(tabIcons).map(([key, icon]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className={`flex-1 flex items-center justify-center space-x-2 h-full border-b-2 transition-all ${
                      activeTab === key
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {icon}
                    <span className="font-medium">{getTabName(key)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setAiGenerating(true)
                      setAiField('Basic Information')
                      setTimeout(() => setAiGenerating(false), 2000)
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Fill Section
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('basic.projectTitle')} *
                    </label>
                    <div className="relative">
                      <Input
                        data-field="title"
                        value={project.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder={`${t('basic.projectTitle')}...`}
                        className="pr-10"
                      />
                      <AIFillButton
                        field="title"
                        onFill={handleAIFill('title')}
                        context={project}
                        projectId={projectId || undefined}
                        language={project.language}
                        className="absolute right-1 top-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('basic.municipality')} *
                    </label>
                    <div className="relative">
                      <Input
                        data-field="municipality"
                        value={project.municipality}
                        onChange={(e) => updateField('municipality', e.target.value)}
                        placeholder={`${t('basic.municipality')}...`}
                        className="pr-10"
                      />
                      <AIFillButton
                        field="municipality"
                        onFill={handleAIFill('municipality')}
                        context={project}
                        projectId={projectId || undefined}
                        language={project.language}
                        className="absolute right-1 top-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('basic.country')} *
                    </label>
                    <Select
                      value={project.country || ''}
                      onValueChange={(value) => updateField('country', value)}
                    >
                      <SelectTrigger data-field="country">
                        <SelectValue placeholder={`${t('basic.country')}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="albania">Albania</SelectItem>
                        <SelectItem value="bosnia">Bosnia and Herzegovina</SelectItem>
                        <SelectItem value="kosovo">Kosovo</SelectItem>
                        <SelectItem value="montenegro">Montenegro</SelectItem>
                        <SelectItem value="north-macedonia">North Macedonia</SelectItem>
                        <SelectItem value="serbia">Serbia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('basic.ipaWindow')} *
                    </label>
                    <Select
                      value={project.ipaWindow || ''}
                      onValueChange={(value) => updateField('ipaWindow', value)}
                    >
                      <SelectTrigger data-field="ipaWindow">
                        <SelectValue placeholder={`${t('basic.ipaWindow')}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="window1">Window I: Rule of Law</SelectItem>
                        <SelectItem value="window2">Window II: Democracy & Governance</SelectItem>
                        <SelectItem value="window3">Window III: Green Agenda</SelectItem>
                        <SelectItem value="window4">Window IV: Competitiveness</SelectItem>
                        <SelectItem value="window5">Window V: Territorial Cooperation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('basic.description')} *
                  </label>
                  <div className="relative">
                    <Textarea
                      data-field="description"
                      value={project.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder={`${t('basic.description')}...`}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <AIFillButton
                      field="description"
                      onFill={handleAIFill('description')}
                      context={project}
                      projectId={projectId || undefined}
                      language={project.language}
                      className="absolute right-2 top-2"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Objectives & SMART Goals */}
              <TabsContent value="objectives" className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Objectives & SMART Goals</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setAiGenerating(true)
                      setAiField('Objectives')
                      setTimeout(() => setAiGenerating(false), 2000)
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Fill Section
                  </Button>
                </div>

                {/* General Objectives */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    General Objectives
                  </label>
                  <div className="relative">
                    <Textarea
                      data-field="objectives"
                      value={project.objectives}
                      onChange={(e) => updateField('objectives', e.target.value)}
                      placeholder="List the main objectives of your project..."
                      className="min-h-[150px] font-mono text-sm"
                    />
                    <AIFillButton
                      field="objectives"
                      onFill={handleAIFill('objectives')}
                      context={project}
                      projectId={projectId || undefined}
                      language={project.language}
                      className="absolute right-2 top-2"
                    />
                  </div>
                </div>

                {/* SMART Objectives */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">{t('objectives.smart')}</h3>

                  <div className="space-y-4">
                    {[
                      { key: 'specific', label: t('objectives.specific'), placeholder: 'What exactly will be accomplished?' },
                      { key: 'measurable', label: t('objectives.measurable'), placeholder: 'How will success be measured?' },
                      { key: 'achievable', label: t('objectives.achievable'), placeholder: 'Is this goal realistic and attainable?' },
                      { key: 'relevant', label: t('objectives.relevant'), placeholder: 'Why is this goal important?' },
                      { key: 'timeBound', label: t('objectives.timeBound'), placeholder: 'What is the timeline for completion?' }
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {label}
                        </label>
                        <div className="relative">
                          <Textarea
                            data-field={`smart-${key}`}
                            value={project.smartObjectives[key as keyof typeof project.smartObjectives]}
                            onChange={(e) => updateSmartObjective(key as any, e.target.value)}
                            placeholder={placeholder}
                            className="min-h-[100px] font-mono text-sm pr-12"
                          />
                          <AIFillButton
                            field={`smart${key.charAt(0).toUpperCase() + key.slice(1)}`}
                            onFill={handleSmartAIFill(key)}
                            context={project}
                            projectId={projectId || undefined}
                            language={project.language}
                            className="absolute right-2 top-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Methodology */}
              <TabsContent value="methodology" className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Implementation Plan</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setAiGenerating(true)
                      setAiField('Methodology')
                      setTimeout(() => setAiGenerating(false), 2000)
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Fill Section
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="inline w-4 h-4 mr-1" />
                      Implementation Methodology
                    </label>
                    <div className="relative">
                      <Textarea
                        data-field="methodology"
                        value={project.methodology}
                        onChange={(e) => updateField('methodology', e.target.value)}
                        placeholder="Describe how the project will be implemented..."
                        className="min-h-[150px] font-mono text-sm"
                      />
                      <AIFillButton
                        field="methodology"
                        onFill={handleAIFill('methodology')}
                        context={project}
                        projectId={projectId || undefined}
                        language={project.language}
                        className="absolute right-2 top-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <AlertTriangle className="inline w-4 h-4 mr-1" />
                      Risk Assessment
                    </label>
                    <div className="relative">
                      <Textarea
                        data-field="risks"
                        value={project.risks}
                        onChange={(e) => updateField('risks', e.target.value)}
                        placeholder="Identify potential risks and mitigation strategies..."
                        className="min-h-[150px] font-mono text-sm"
                      />
                      <AIFillButton
                        field="risks"
                        onFill={handleAIFill('risks')}
                        context={project}
                        projectId={projectId || undefined}
                        language={project.language}
                        className="absolute right-2 top-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <TrendingUp className="inline w-4 h-4 mr-1" />
                      Sustainability Plan
                    </label>
                    <div className="relative">
                      <Textarea
                        data-field="sustainability"
                        value={project.sustainability}
                        onChange={(e) => updateField('sustainability', e.target.value)}
                        placeholder="How will project results be sustained after funding ends..."
                        className="min-h-[150px] font-mono text-sm"
                      />
                      <AIFillButton
                        field="sustainability"
                        onFill={handleAIFill('sustainability')}
                        context={project}
                        projectId={projectId || undefined}
                        language={project.language}
                        className="absolute right-2 top-2"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Budget */}
              <TabsContent value="budget" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Budget Planning</h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Budget (EUR) *
                    </label>
                    <div className="relative">
                      <Input
                        data-field="budget"
                        type="number"
                        value={project.budget}
                        onChange={(e) => updateField('budget', e.target.value)}
                        placeholder="Enter amount..."
                        max="10500000"
                      />
                      <AIFillButton
                        field="budget"
                        onFill={handleAIFill('budget')}
                        context={project}
                        projectId={projectId || undefined}
                        language={project.language}
                        className="absolute right-1 top-1"
                      />
                    </div>
                    {project.budget && parseInt(project.budget) > 10500000 && (
                      <p className="text-red-500 text-xs mt-1">Budget cannot exceed €10.5 million</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (months) *
                    </label>
                    <Input
                      data-field="duration"
                      type="number"
                      value={project.duration}
                      onChange={(e) => updateField('duration', e.target.value)}
                      placeholder="Enter duration..."
                      min="1"
                      max="60"
                    />
                  </div>
                </div>

                {project.budget && parseInt(project.budget) <= 10500000 && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-4">EU Co-Financing Breakdown (85/15)</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Euro className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-sm text-gray-600">EU Contribution</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          €{(parseInt(project.budget) * 0.85).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">85% of total</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Building2 className="w-4 h-4 text-orange-600" />
                          </div>
                          <p className="text-sm text-gray-600">Co-Financing</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">
                          €{(parseInt(project.budget) * 0.15).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">15% of total</p>
                      </div>

                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <p className="text-sm text-gray-600">Total Budget</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          €{parseInt(project.budget).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">100% funding</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Review */}
              <TabsContent value="review" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Submit</h2>

                {/* Compliance Check */}
                <div className={`p-6 rounded-lg ${
                  meetsWindowThreshold ? 'bg-green-50' : 'bg-yellow-50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Compliance Status</h3>
                    <Badge className={
                      meetsWindowThreshold ? 'bg-green-600' :
                      complianceScore >= cautionThreshold ? 'bg-yellow-600' : 'bg-red-600'
                    }>
                      {t('review.complianceScore')}: {complianceScore}% • {t('review.thresholdTarget', { value: compliance.windowThreshold })}
                    </Badge>
                  </div>

                  {!meetsWindowThreshold && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">{t('review.focusSections')}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {sectionsNeedingAttention.map((section) => (
                          <div key={section.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <p className="text-sm font-semibold text-amber-800">{section.label}</p>
                            <p className="text-xs text-amber-700">Score {section.percentage}% • Target {section.threshold}%</p>
                            <ul className="mt-2 space-y-1 text-xs text-amber-700">
                              {section.items
                                .filter((item) => !item.met)
                                .map((item) => (
                                  <li key={item.id} className="flex items-start gap-1">
                                    <span>•</span>
                                    <span>{item.guidance}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Summary */}
                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-900">Project Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Title:</span>
                      <p className="text-gray-900 mt-1">{project.title || 'Not filled'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Municipality:</span>
                      <p className="text-gray-900 mt-1">{project.municipality || 'Not filled'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Country:</span>
                      <p className="text-gray-900 mt-1">{project.country || 'Not selected'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">IPA Window:</span>
                      <p className="text-gray-900 mt-1">{project.ipaWindow || 'Not selected'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Budget:</span>
                      <p className="text-gray-900 mt-1">
                        {project.budget ? `€${parseInt(project.budget).toLocaleString()}` : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Duration:</span>
                      <p className="text-gray-900 mt-1">{project.duration ? `${project.duration} months` : 'Not specified'}</p>
                    </div>
                  </div>

                  {project.description && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="font-medium text-gray-600">Description Preview:</span>
                      <p className="text-gray-900 mt-2 text-sm whitespace-pre-wrap">
                        {project.description.substring(0, 200)}...
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setIsSaving(true)
                      // Save logic
                      setTimeout(() => setIsSaving(false), 1000)
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>

                  <Button
                    disabled={!meetsWindowThreshold}
                    className={`${
                      meetsWindowThreshold
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gray-300 cursor-not-allowed'
                    } text-white`}
                    onClick={() => {
                      if (meetsWindowThreshold) {
                        updateField('status', 'submitted')
                        setShowSuccess(true)
                      }
                    }}
                  >
                    {meetsWindowThreshold ? t('review.submit') : t('review.needScore', { value: compliance.windowThreshold })}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  )
}