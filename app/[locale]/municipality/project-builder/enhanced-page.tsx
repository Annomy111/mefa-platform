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
import { FileText, Building2, Euro, CheckCircle, Sparkles, Save, Zap, Globe, Loader2 } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// Helper function to get language name
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

export default function EnhancedProjectBuilder() {
  const {
    project,
    updateField,
    updateSmartObjective,
    setProject,
    projectId,
    setProjectId,
    setAutoSaving,
    calculateCompliance,
    getProjectContext,
    isAutoSaving
  } = useProjectStore()

  const [showSuccess, setShowSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiGeneratingField, setAiGeneratingField] = useState<string | null>(null)
  const locale = useLocale()
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

  // Auto-save to database
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
            if (!projectId) setProjectId(data.id)
            setLastSaved(new Date())
          } else {
            setSaveError('Failed to save changes')
          }
        } catch (error) {
          console.error('Auto-save error:', error)
          setSaveError('Connection error - changes not saved')
        }
        setAutoSaving(false)
      }
    }, 2000)

    return () => clearTimeout(saveTimer)
  }, [project])

  const compliance = calculateCompliance()
  const complianceScore = compliance.total
  const meetsWindowThreshold = compliance.meetsWindowThreshold
  const thresholdVariant = meetsWindowThreshold
    ? 'success'
    : complianceScore >= Math.max(0, compliance.windowThreshold - 10)
      ? 'warning'
      : 'destructive'

  const handleAIFillField = (field: string) => async (value: string) => {
    updateField(field, value)

    // Highlight the field that was just filled
    const element = document.querySelector(`[data-field="${field}"]`)
    if (element) {
      element.classList.add('animate-highlight-green')
      setTimeout(() => element.classList.remove('animate-highlight-green'), 1000)
    }
  }

  const handleAutoComplete = (results: Record<string, any>) => {
    Object.entries(results).forEach(([key, value]) => {
      if (key.startsWith('smart')) {
        const smartKey = key.replace('smart', '')
        updateSmartObjective(smartKey.charAt(0).toLowerCase() + smartKey.slice(1) as any, value)
      } else {
        updateField(key, value)
      }
    })
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 5000)
  }

  const handleSectionFill = (value: string) => {
    // Parse the value as JSON if it's a stringified object
    try {
      const results = typeof value === 'string' && value.startsWith('{') ? JSON.parse(value) : { basic: value }
      handleAutoComplete(results)
    } catch {
      // If parsing fails, treat it as a single value
      updateField('description', value)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Header with Auto-Complete */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">MEFA Project Builder</h1>
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">AI-Powered EU Funding Application</p>
                {/* Auto-save indicator */}
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {isAutoSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : saveError ? (
                    <>
                      <span className="text-red-500">⚠ {saveError}</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={project.mode === 'template' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => updateField('mode', 'template')}
                  className="px-3 py-1"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Template
                </Button>
                <Button
                  variant={project.mode === 'custom' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => updateField('mode', 'custom')}
                  className="px-3 py-1"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Custom
                </Button>
              </div>

              {/* Language Selector */}
              <Select
                value={project.language || locale}
                onValueChange={handleLocaleChange}
              >
                <SelectTrigger className="w-[180px]">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select language" />
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

              <div className="text-center min-w-[160px]">
                <div className="text-3xl font-bold text-blue-600">{complianceScore}%</div>
                <Badge variant={thresholdVariant}>
                  {meetsWindowThreshold ? 'Meets Target' : `Need ≥ ${compliance.windowThreshold}%`}
                </Badge>
              </div>

              <AutoCompleteButton
                context={getProjectContext()}
                projectId={projectId || undefined}
                language={project.language || 'en'}
                onComplete={handleAutoComplete}
              />
            </div>
          </div>

          <Progress
            value={complianceScore}
            className="mt-4 h-2"
            aria-valuenow={complianceScore}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />

          <div className="mt-4 rounded-xl border border-blue-100 bg-white/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-800">{compliance.windowLabel}</span>
              <span>
                Threshold ≥ {compliance.windowThreshold}% • {meetsWindowThreshold ? 'On track for submission' : 'Improve sections below target'}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {compliance.sections.map((section) => {
                const sectionWeight = Math.round(section.weight * 100)
                const sectionStatus = section.meetsThreshold ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'

                return (
                  <div
                    key={section.id}
                    className={`rounded-lg border p-4 transition-colors ${sectionStatus}`}
                  >
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{section.label}</span>
                      <span>{section.percentage}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/60">
                      <div
                        className={`h-full ${section.meetsThreshold ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${section.percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-600">
                      Weight {sectionWeight}% • Target ≥ {section.threshold}%
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
      <main className="container mx-auto px-6 py-8 relative">
        {/* AI Generation Overlay */}
        {aiGenerating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md shadow-2xl">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Sparkles className="h-12 w-12 text-blue-600 animate-pulse" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                </div>
                <h3 className="text-lg font-semibold">AI is generating content</h3>
                <p className="text-sm text-gray-600 text-center">
                  {aiGeneratingField ? `Creating ${aiGeneratingField}...` : 'Please wait while we generate your content'}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-fade-in">
            <CheckCircle className="inline mr-2" />
            Application successfully generated! Review and customize as needed.
          </div>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
            <TabsTrigger value="methodology">Methodology</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <TabsContent value="basic" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Basic Information</h2>
                <AIFillButton
                  variant="section"
                  sectionName="basic"
                  sectionFields={['title', 'municipality', 'description']}
                  field="basic"
                  onFill={handleSectionFill}
                  context={project}
                  projectId={projectId || undefined}
                  language={project.language || 'en'}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <Input
                    data-field="title"
                    label="Project Title"
                    placeholder="Enter project title..."
                    value={project.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    icon={FileText}
                  />
                  <AIFillButton
                    field="title"
                    onFill={handleAIFillField('title')}
                    context={project}
                    projectId={projectId || undefined}
                    language={project.language || 'en'}
                    className="absolute right-2 top-8"
                  />
                </div>

                <div className="relative">
                  <Input
                    data-field="municipality"
                    label="Municipality"
                    placeholder="Enter municipality..."
                    value={project.municipality}
                    onChange={(e) => updateField('municipality', e.target.value)}
                    icon={Building2}
                  />
                  <AIFillButton
                    field="municipality"
                    onFill={handleAIFillField('municipality')}
                    context={project}
                    projectId={projectId || undefined}
                    language={project.language || 'en'}
                    className="absolute right-2 top-8"
                  />
                </div>

                {/* Country Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Select
                    value={project.country || ''}
                    onValueChange={(value) => updateField('country', value)}
                  >
                    <SelectTrigger data-field="country">
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

                {/* IPA Window Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">IPA Window</label>
                  <Select
                    value={project.ipaWindow || ''}
                    onValueChange={(value) => updateField('ipaWindow', value)}
                  >
                    <SelectTrigger data-field="ipaWindow">
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

              <div className="relative">
                <Textarea
                  data-field="description"
                  label="Project Description"
                  placeholder="Describe your project..."
                  value={project.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="min-h-[200px]"
                />
                <AIFillButton
                  field="description"
                  onFill={handleAIFillField('description')}
                  context={project}
                  projectId={projectId || undefined}
                  language={project.language || 'en'}
                  className="absolute right-2 top-8"
                />
              </div>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Objectives & SMART Goals</h2>
                <AIFillButton
                  variant="section"
                  sectionName="objectives"
                  sectionFields={['objectives', 'smartSpecific', 'smartMeasurable', 'smartAchievable', 'smartRelevant', 'smartTimeBound']}
                  field="objectives"
                  onFill={handleSectionFill}
                  context={project}
                  projectId={projectId || undefined}
                  language={project.language || 'en'}
                />
              </div>

              <div className="relative">
                <Textarea
                  data-field="objectives"
                  label="General Objectives"
                  placeholder="Main project objectives..."
                  value={project.objectives}
                  onChange={(e) => updateField('objectives', e.target.value)}
                  className="min-h-[150px]"
                />
                <AIFillButton
                  field="objectives"
                  onFill={handleAIFillField('objectives')}
                  context={project}
                  projectId={projectId || undefined}
                  language={project.language || 'en'}
                  className="absolute right-2 top-8"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">SMART Objectives</h3>
                {Object.entries(project.smartObjectives).map(([key, value]) => (
                  <div key={key} className="relative">
                    <Input
                      data-field={`smart${key.charAt(0).toUpperCase() + key.slice(1)}`}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      value={value}
                      onChange={(e) => updateSmartObjective(key as any, e.target.value)}
                    />
                    <AIFillButton
                      field={`smart${key.charAt(0).toUpperCase() + key.slice(1)}`}
                      onFill={(val) => updateSmartObjective(key as any, val)}
                      context={project}
                      projectId={projectId || undefined}
                      language={project.language || 'en'}
                      className="absolute right-2 top-8"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="methodology" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Implementation Plan</h2>
                <AIFillButton
                  variant="section"
                  sectionName="methodology"
                  sectionFields={['methodology', 'risks', 'sustainability']}
                  field="methodology"
                  onFill={handleSectionFill}
                  context={project}
                  projectId={projectId || undefined}
                  language={project.language || 'en'}
                />
              </div>

              {['methodology', 'risks', 'sustainability'].map((field) => (
                <div key={field} className="relative">
                  <Textarea
                    data-field={field}
                    label={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={project[field as keyof typeof project] as string}
                    onChange={(e) => updateField(field, e.target.value)}
                    className="min-h-[150px]"
                  />
                  <AIFillButton
                    field={field}
                    onFill={handleAIFillField(field)}
                    context={project}
                    projectId={projectId || undefined}
                    language={project.language || 'en'}
                    className="absolute right-2 top-8"
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="budget" className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Budget & Timeline</h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <Input
                    data-field="budget"
                    label="Total Budget (EUR)"
                    type="number"
                    value={project.budget}
                    onChange={(e) => updateField('budget', e.target.value)}
                    icon={Euro}
                  />
                  <AIFillButton
                    field="budget"
                    onFill={handleAIFillField('budget')}
                    context={project}
                    projectId={projectId || undefined}
                    language={project.language || 'en'}
                    className="absolute right-2 top-8"
                  />
                </div>

                <Input
                  data-field="duration"
                  label="Duration (months)"
                  type="number"
                  value={project.duration}
                  onChange={(e) => updateField('duration', e.target.value)}
                />
              </div>

              {project.budget && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">EU Co-Financing (85/15)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded">
                      <div className="text-sm text-gray-600">EU Contribution</div>
                      <div className="text-2xl font-bold text-blue-600">
                        €{(parseInt(project.budget) * 0.85).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded">
                      <div className="text-sm text-gray-600">Co-Financing</div>
                      <div className="text-2xl font-bold text-yellow-600">
                        €{(parseInt(project.budget) * 0.15).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded">
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="text-2xl font-bold text-green-600">
                        €{parseInt(project.budget).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="review" className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Application Review</h2>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Project Summary</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Title:</strong> {project.title || 'Not filled'}</p>
                  <p><strong>Municipality:</strong> {project.municipality || 'Not filled'}</p>
                  <p><strong>Country:</strong> {project.country || 'Not selected'}</p>
                  <p><strong>IPA Window:</strong> {project.ipaWindow || 'Not selected'}</p>
                  <p><strong>Budget:</strong> €{project.budget ? parseInt(project.budget).toLocaleString() : '0'}</p>
                  <p><strong>Duration:</strong> {project.duration || '0'} months</p>
                  <p><strong>Language:</strong> {getLanguageName(project.language || 'en')}</p>
                  <p>
                    <strong>Compliance Score:</strong> {complianceScore}%
                    {' '}
                    ({meetsWindowThreshold ? 'Target met' : `Target ≥ ${compliance.windowThreshold}%`})
                  </p>
                </div>
              </div>

              {/* Detailed Review Sections */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600">
                    {project.description ? `${project.description.substring(0, 150)}...` : 'Not filled'}
                  </p>
                </div>
                <div className="bg-white p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Objectives</h4>
                  <p className="text-sm text-gray-600">
                    {project.objectives ? `${project.objectives.substring(0, 150)}...` : 'Not filled'}
                  </p>
                </div>
              </div>

              {/* Submission Status */}
              {project.status === 'submitted' && (
                <div className="bg-green-100 p-4 border border-green-400 rounded-lg">
                  <CheckCircle className="inline h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium">Application Submitted Successfully</span>
                  <p className="text-sm mt-1">Reference: {projectId}</p>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  onClick={async () => {
                    setIsSaving(true)
                    try {
                      const response = await fetch('/api/projects', {
                        method: projectId ? 'PUT' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...project, id: projectId, status: 'draft' })
                      })
                      if (response.ok) {
                        const data = await response.json()
                        if (!projectId) setProjectId(data.id)
                        setShowSuccess(true)
                        setTimeout(() => setShowSuccess(false), 3000)
                      }
                    } catch (error) {
                      console.error('Save error:', error)
                    }
                    setIsSaving(false)
                  }}
                  disabled={isSaving}
                  variant="outline"
                >
                  {isSaving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Save Draft</>
                  )}
                </Button>

                <Button
                  onClick={async () => {
                    if (meetsWindowThreshold) {
                      setIsSaving(true)
                      try {
                        const response = await fetch('/api/projects', {
                          method: projectId ? 'PUT' : 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...project, id: projectId, status: 'submitted' })
                        })
                        if (response.ok) {
                          const data = await response.json()
                          if (!projectId) setProjectId(data.id)
                          updateField('status', 'submitted')
                          setShowSuccess(true)
                          setTimeout(() => setShowSuccess(false), 5000)
                        }
                      } catch (error) {
                        console.error('Submit error:', error)
                      }
                      setIsSaving(false)
                    }
                  }}
                  variant={meetsWindowThreshold ? "default" : "secondary"}
                  disabled={!meetsWindowThreshold || isSaving || project.status === 'submitted'}
                  className="min-w-[200px] bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                >
                  {project.status === 'submitted' ? (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Submitted</>
                  ) : !meetsWindowThreshold ? (
                    `Need ≥ ${compliance.windowThreshold}%`
                  ) : isSaving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    'Submit to NIPAC'
                  )}
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}