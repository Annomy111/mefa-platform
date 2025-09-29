"use client"

export const runtime = 'edge'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Building2,
  Target,
  Users,
  Calendar,
  Euro,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Globe,
  BookOpen,
  Award
} from 'lucide-react'

export default function ProjectBuilder() {
  const [mode, setMode] = useState<'template' | 'custom'>('template')
  const [language, setLanguage] = useState('en')
  const [complianceScore, setComplianceScore] = useState(45)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [project, setProject] = useState({
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
    partners: [],
    risks: '',
    sustainability: ''
  })

  const languages = {
    en: 'English',
    sq: 'Shqip',
    bs: 'Bosanski',
    hr: 'Hrvatski',
    mk: 'Македонски',
    me: 'Crnogorski',
    sr: 'Српски',
    tr: 'Türkçe'
  }

  const ipaWindows = [
    { value: 'window1', label: 'Window 1: Rule of Law', icon: '⚖️' },
    { value: 'window2', label: 'Window 2: Governance & PAR', icon: '🏛️' },
    { value: 'window3', label: 'Window 3: Green Agenda', icon: '🌱' },
    { value: 'window4', label: 'Window 4: Competitiveness', icon: '💼' },
    { value: 'window5', label: 'Window 5: Connectivity', icon: '🔗' }
  ]

  const calculateCompliance = () => {
    let score = 0
    const checks = {
      title: project.title.length > 10,
      municipality: project.municipality.length > 0,
      ipaWindow: project.ipaWindow.length > 0,
      budget: project.budget.length > 0 && parseInt(project.budget) <= 10500000,
      objectives: project.objectives.length > 50,
      smartComplete: Object.values(project.smartObjectives).every(v => v.length > 10),
      methodology: project.methodology.length > 50,
      risks: project.risks.length > 30
    }

    Object.values(checks).forEach(check => {
      if (check) score += 12.5
    })

    setComplianceScore(Math.min(100, Math.round(score)))
  }

  useEffect(() => {
    calculateCompliance()
  }, [project])

  const handleAIAssist = async (field: string) => {
    setAiLoading(field)
    try {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field,
          context: project,
          language
        })
      })

      if (response.ok) {
        const { suggestion } = await response.json()

        if (field.startsWith('smart')) {
          const smartKey = field.replace('smart', '')
          const key = smartKey.charAt(0).toLowerCase() + smartKey.slice(1)
          setProject({
            ...project,
            smartObjectives: {
              ...project.smartObjectives,
              [key]: suggestion
            }
          })
        } else {
          setProject({ ...project, [field]: suggestion })
        }

        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } catch (error) {
      console.error('AI assist error:', error)
    } finally {
      setAiLoading(null)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!project.title || project.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters'
    }
    if (!project.municipality) {
      newErrors.municipality = 'Municipality is required'
    }
    if (!project.country) {
      newErrors.country = 'Country is required'
    }
    if (!project.ipaWindow) {
      newErrors.ipaWindow = 'IPA Window selection is required'
    }
    if (project.budget && parseInt(project.budget) > 10500000) {
      newErrors.budget = 'Budget cannot exceed €10.5 million'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveProject = async (status: 'draft' | 'submitted' = 'draft') => {
    if (status === 'submitted' && !validateForm()) {
      return
    }

    setLoading(true)
    try {
      const method = savedProjectId ? 'PUT' : 'POST'
      const response = await fetch('/api/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          id: savedProjectId,
          status,
          complianceScore
        })
      })

      if (response.ok) {
        const saved = await response.json()
        setSavedProjectId(saved.id)
        localStorage.setItem('currentProjectId', saved.id)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('projectDraft')
    if (saved) {
      setProject(JSON.parse(saved))
    }
  }

  const saveToLocalStorage = () => {
    localStorage.setItem('projectDraft', JSON.stringify(project))
  }

  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      saveToLocalStorage()
    }, 1000)
    return () => clearTimeout(timer)
  }, [project])

  const getComplianceColor = () => {
    if (complianceScore < 33) return 'text-red-500'
    if (complianceScore < 66) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getComplianceBadge = () => {
    if (complianceScore < 33) return <Badge variant="destructive">Low Compliance</Badge>
    if (complianceScore < 66) return <Badge variant="warning">Medium Compliance</Badge>
    return <Badge variant="success">High Compliance</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-600 via-yellow-500 to-blue-600 p-2 rounded-lg animate-gradient">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                  MEFA Project Builder
                </h1>
                <p className="text-sm text-gray-600">Municipal EU Funds Application Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-40">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(languages).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${getComplianceColor()}`}>
                  {complianceScore}%
                </div>
                {getComplianceBadge()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Mode Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Project Mode
            </h2>
            <div className="flex gap-2">
              <Button
                variant={mode === 'template' ? 'default' : 'outline'}
                onClick={() => setMode('template')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Template Mode
              </Button>
              <Button
                variant={mode === 'custom' ? 'default' : 'outline'}
                onClick={() => setMode('custom')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Custom Mode
              </Button>
            </div>
          </div>

          <Progress value={complianceScore} className="h-3" indicatorClassName={
            complianceScore < 33 ? "bg-red-500" :
            complianceScore < 66 ? "bg-yellow-500" :
            "bg-green-500"
          } />

          <div className="grid grid-cols-4 gap-4 mt-4">
            {[
              { label: 'Basic Info', complete: project.title && project.municipality },
              { label: 'IPA Window', complete: project.ipaWindow },
              { label: 'Objectives', complete: project.objectives },
              { label: 'Budget', complete: project.budget }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                {item.complete ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Builder Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-5 w-full mb-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="objectives" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objectives
              </TabsTrigger>
              <TabsTrigger value="methodology" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Methodology
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Budget
              </TabsTrigger>
              <TabsTrigger value="partners" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Partners
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Project Title"
                  placeholder="Enter your project title..."
                  value={project.title}
                  onChange={(e) => setProject({...project, title: e.target.value})}
                  error={errors.title}
                  icon={FileText}
                />

                <Input
                  label="Municipality"
                  placeholder="Enter municipality name..."
                  value={project.municipality}
                  onChange={(e) => setProject({...project, municipality: e.target.value})}
                  error={errors.municipality}
                  icon={Building2}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <Select value={project.country} onValueChange={(v) => setProject({...project, country: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="albania">🇦🇱 Albania</SelectItem>
                      <SelectItem value="bosnia">🇧🇦 Bosnia & Herzegovina</SelectItem>
                      <SelectItem value="kosovo">🇽🇰 Kosovo</SelectItem>
                      <SelectItem value="macedonia">🇲🇰 North Macedonia</SelectItem>
                      <SelectItem value="montenegro">🇲🇪 Montenegro</SelectItem>
                      <SelectItem value="serbia">🇷🇸 Serbia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">IPA III Window</label>
                  <Select value={project.ipaWindow} onValueChange={(v) => setProject({...project, ipaWindow: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select IPA window..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ipaWindows.map(window => (
                        <SelectItem key={window.value} value={window.value}>
                          <span className="flex items-center gap-2">
                            <span>{window.icon}</span>
                            <span>{window.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Textarea
                label="Project Description"
                placeholder="Provide a comprehensive description of your project..."
                value={project.description}
                onChange={(e) => setProject({...project, description: e.target.value})}
                className="min-h-[150px]"
              />

              <div className="flex justify-end">
                <Button
                  variant="eu"
                  onClick={() => handleAIAssist('description')}
                  disabled={aiLoading === 'description'}
                >
                  {aiLoading === 'description' ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Assist
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-6 animate-fade-in">
              <Textarea
                label="General Objectives"
                placeholder="Describe your project's main objectives..."
                value={project.objectives}
                onChange={(e) => setProject({...project, objectives: e.target.value})}
                className="min-h-[120px]"
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  SMART Objectives
                </h3>

                <div className="grid gap-4">
                  {Object.entries({
                    specific: 'Specific - What exactly will you achieve?',
                    measurable: 'Measurable - How will you measure success?',
                    achievable: 'Achievable - Is it realistic with your resources?',
                    relevant: 'Relevant - How does it align with IPA III priorities?',
                    timeBound: 'Time-Bound - What is your timeline?'
                  }).map(([key, label]) => (
                    <Input
                      key={key}
                      label={label}
                      value={project.smartObjectives[key as keyof typeof project.smartObjectives]}
                      onChange={(e) => setProject({
                        ...project,
                        smartObjectives: {
                          ...project.smartObjectives,
                          [key]: e.target.value
                        }
                      })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="eu"
                  onClick={() => handleAIAssist('objectives')}
                  disabled={aiLoading === 'objectives'}
                >
                  {aiLoading === 'objectives' ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate SMART Objectives
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="methodology" className="space-y-6 animate-fade-in">
              <Textarea
                label="Implementation Methodology"
                placeholder="Describe your implementation approach..."
                value={project.methodology}
                onChange={(e) => setProject({...project, methodology: e.target.value})}
                className="min-h-[150px]"
              />

              <Textarea
                label="Risk Assessment"
                placeholder="Identify potential risks and mitigation strategies..."
                value={project.risks}
                onChange={(e) => setProject({...project, risks: e.target.value})}
                className="min-h-[120px]"
              />

              <Textarea
                label="Sustainability Plan"
                placeholder="How will the project continue after EU funding ends..."
                value={project.sustainability}
                onChange={(e) => setProject({...project, sustainability: e.target.value})}
                className="min-h-[120px]"
              />
            </TabsContent>

            <TabsContent value="budget" className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Total Budget (EUR)"
                  type="number"
                  placeholder="Enter total budget..."
                  value={project.budget}
                  onChange={(e) => setProject({...project, budget: e.target.value})}
                  icon={Euro}
                />

                <Input
                  label="Project Duration (months)"
                  type="number"
                  placeholder="Duration in months..."
                  value={project.duration}
                  onChange={(e) => setProject({...project, duration: e.target.value})}
                  icon={Calendar}
                />
              </div>

              {project.budget && (
                <div className="bg-blue-50 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-blue-900">EU Co-Financing (85/15 Rule)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600">EU Contribution (85%)</div>
                      <div className="text-2xl font-bold text-blue-600">
                        €{(parseInt(project.budget) * 0.85).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600">Co-Financing (15%)</div>
                      <div className="text-2xl font-bold text-yellow-600">
                        €{(parseInt(project.budget) * 0.15).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600">Total Budget</div>
                      <div className="text-2xl font-bold text-green-600">
                        €{parseInt(project.budget).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="partners" className="space-y-6 animate-fade-in">
              <div className="text-center py-12 text-gray-500">
                Partner management coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => saveProject('draft')}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </Button>
          <div className="flex gap-4">
            {showSuccess && (
              <div className="flex items-center gap-2 text-green-600 animate-fade-in">
                <CheckCircle className="h-5 w-5" />
                <span>Saved successfully!</span>
              </div>
            )}
            <Button
              variant="secondary"
              onClick={() => window.print()}
            >
              Preview Application
            </Button>
            <Button
              variant="eu"
              className="min-w-[200px]"
              onClick={() => saveProject('submitted')}
              disabled={loading || complianceScore < 75}
            >
              {complianceScore < 75 ? 'Complete Required Fields' : 'Submit to NIPAC'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}