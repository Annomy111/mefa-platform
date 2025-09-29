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
  TrendingUp, Shield, Users, Award, ChevronRight
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

export default function NewEnhancedProjectBuilder() {
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
  const locale = useLocale()
  const reviewT = useTranslations('review')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    updateField('language', locale)
  }, [locale, updateField])

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

  // Auto-save
  useEffect(() => {
    const saveTimer = setTimeout(async () => {
      if (project.title || project.municipality) {
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
        }
        setAutoSaving(false)
      }
    }, 2000)

    return () => clearTimeout(saveTimer)
  }, [project])

  const compliance = calculateCompliance()
  const complianceScore = compliance.total
  const meetsWindowThreshold = compliance.meetsWindowThreshold
  const cautionThreshold = Math.max(0, compliance.windowThreshold - 10)
  const complianceStrokeColor = meetsWindowThreshold ? '#10b981' : complianceScore >= cautionThreshold ? '#f59e0b' : '#ef4444'
  const sectionsNeedingAttention = compliance.sections.filter((section) => !section.meetsThreshold)

  const handleAIFill = (field: string) => async (value: string) => {
    updateField(field, value)
    const element = document.querySelector(`[data-field="${field}"]`)
    if (element) {
      element.classList.add('animate-highlight-green')
      setTimeout(() => element.classList.remove('animate-highlight-green'), 1000)
    }
  }

  const handleAutoComplete = async () => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 5000)
  }

  const tabIcons = {
    basic: <FileText className="w-4 h-4" />,
    objectives: <Target className="w-4 h-4" />,
    methodology: <Briefcase className="w-4 h-4" />,
    budget: <Euro className="w-4 h-4" />,
    review: <CheckCircle className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
                  <h1 className="text-xl font-bold text-gray-900">MEFA Platform</h1>
                  <p className="text-xs text-gray-500">IPA III Application Builder</p>
                </div>
              </div>

              {/* Save Status */}
              {(isAutoSaving || lastSaved) && (
                <div className="flex items-center space-x-2 text-sm">
                  {isAutoSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      <span className="text-gray-600">Saving...</span>
                    </>
                  ) : saveError ? (
                    <span className="text-red-500">⚠ {saveError}</span>
                  ) : lastSaved ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-gray-600">Saved</span>
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

              {/* Language */}
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
                  <SelectItem value="sq">Albanian</SelectItem>
                  <SelectItem value="bs">Bosnian</SelectItem>
                  <SelectItem value="hr">Croatian</SelectItem>
                  <SelectItem value="mk">Macedonian</SelectItem>
                  <SelectItem value="me">Montenegrin</SelectItem>
                  <SelectItem value="sr">Serbian</SelectItem>
                  <SelectItem value="tr">Turkish</SelectItem>
                </SelectContent>
              </Select>

              {/* Compliance Score */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{complianceScore}%</p>
                  <p className="text-xs text-gray-500">{reviewT('thresholdTarget', { value: compliance.windowThreshold })}</p>
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
                      strokeDasharray={`${(complianceScore / 100) * 126} 126`}
                      className="transition-all duration-500"
                    />
                  </svg>
                </div>
                <Badge variant={meetsWindowThreshold ? 'success' : complianceScore >= cautionThreshold ? 'warning' : 'destructive'}>
                  {meetsWindowThreshold ? reviewT('thresholdMet') : reviewT('needScore', { value: compliance.windowThreshold })}
                </Badge>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleAutoComplete}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
              >

            <div className="mt-4 rounded-xl border border-blue-100 bg-white/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{compliance.windowLabel}</span>
                <span>
                  {meetsWindowThreshold ? reviewT('thresholdMet') : reviewT('thresholdPending')}
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
                <Zap className="w-4 h-4 mr-2" />
                Generate All
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={complianceScore} className="h-1 bg-gray-200" />
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
                    <span className="font-medium capitalize">{key}</span>
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
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Fill Section
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Title
                    </label>
                    <div className="relative">
                      <Input
                        data-field="title"
                        value={project.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Enter project title..."
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
                      Municipality
                    </label>
                    <div className="relative">
                      <Input
                        data-field="municipality"
                        value={project.municipality}
                        onChange={(e) => updateField('municipality', e.target.value)}
                        placeholder="Enter municipality..."
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
                      Country
                    </label>
                    <Select
                      value={project.country || ''}
                      onValueChange={(value) => updateField('country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country..." />
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
                      IPA Window
                    </label>
                    <Select
                      value={project.ipaWindow || ''}
                      onValueChange={(value) => updateField('ipaWindow', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select IPA window..." />
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
                    Project Description
                  </label>
                  <div className="relative">
                    <Textarea
                      data-field="description"
                      value={project.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Describe your project..."
                      className="min-h-[200px]"
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

              {/* Other tabs... */}
              <TabsContent value="objectives" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Objectives & SMART Goals</h2>
                <p className="text-gray-600">Define clear, measurable objectives for your project.</p>
              </TabsContent>

              <TabsContent value="methodology" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Implementation Methodology</h2>
                <p className="text-gray-600">Describe how you will implement the project.</p>
              </TabsContent>

              <TabsContent value="budget" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Budget Planning</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Budget (EUR)
                    </label>
                    <Input
                      type="number"
                      value={project.budget}
                      onChange={(e) => updateField('budget', e.target.value)}
                      placeholder="Enter amount..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (months)
                    </label>
                    <Input
                      type="number"
                      value={project.duration}
                      onChange={(e) => updateField('duration', e.target.value)}
                      placeholder="Enter duration..."
                    />
                  </div>
                </div>

                {project.budget && (
                  <div className="mt-6 p-6 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4">EU Co-Financing (85/15)</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600">EU Contribution</p>
                        <p className="text-2xl font-bold text-blue-600">
                          €{(parseInt(project.budget) * 0.85).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Co-Financing</p>
                        <p className="text-2xl font-bold text-orange-600">
                          €{(parseInt(project.budget) * 0.15).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-green-600">
                          €{parseInt(project.budget).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="review" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>

                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-900">Project Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Title:</span>
                      <p className="text-gray-900">{project.title || 'Not filled'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Municipality:</span>
                      <p className="text-gray-900">{project.municipality || 'Not filled'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Budget:</span>
                      <p className="text-gray-900">€{project.budget || '0'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Compliance:</span>
                      <p className="text-gray-900">{complianceScore}% ({reviewT('thresholdTarget', { value: compliance.windowThreshold })})</p>
                    </div>
                  </div>
                </div>

                {!meetsWindowThreshold && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-800">{reviewT('focusSections')}</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {sectionsNeedingAttention.map((section) => (
                        <div key={section.id} className="rounded-lg border border-amber-300 bg-white/70 p-3">
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

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => console.log('Save draft')}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    disabled={!meetsWindowThreshold}
                    className={
                      meetsWindowThreshold
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }
                  >
                    {meetsWindowThreshold ? reviewT('submit') : reviewT('needScore', { value: compliance.windowThreshold })}
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