"use client"

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Sparkles, Check, Loader2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIFillButtonProps {
  field: string
  onFill: (value: string) => void
  context: any
  projectId?: string
  language?: string
  className?: string
  variant?: 'single' | 'section'
  sectionFields?: string[]
  sectionName?: string
}

export function AIFillButton({
  field,
  onFill,
  context,
  projectId,
  language = 'en',
  className,
  variant = 'single',
  sectionFields = [],
  sectionName = ''
}: AIFillButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [animation, setAnimation] = useState<'pulse' | 'spin' | 'bounce' | null>(null)

  const handleAIFill = async () => {
    setStatus('loading')
    setAnimation('spin')

    try {
      if (variant === 'section' && sectionFields.length > 0) {
        // Fill entire section
        const response = await fetch('/api/ai-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'fill-section',
            sectionName,
            fields: sectionFields,
            context,
            language,
            projectId
          })
        })

        if (response.ok) {
          const data = await response.json()

          // Animate each field being filled
          for (const [fieldName, value] of Object.entries(data.results)) {
            onFill(value as string)

            // Visual feedback for each field
            const fieldElement = document.querySelector(`[data-field="${fieldName}"]`)
            if (fieldElement) {
              fieldElement.classList.add('animate-highlight-green')
              await new Promise(r => setTimeout(r, 500))
            }
          }

          setStatus('success')
          setAnimation('bounce')
        }
      } else {
        // Single field fill
        const response = await fetch('/api/ai-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field,
            context,
            language,
            projectId
          })
        })

        if (response.ok) {
          const data = await response.json()

          // Check if content is AI-generated, cached, or fallback
          const isAIGenerated = data.source === 'ai'
          const isCached = data.cached === true
          const isFallback = data.source === 'error'

          // Animate the field being filled with appropriate color
          const fieldElement = document.querySelector(`[data-field="${field}"]`)
          if (fieldElement) {
            if (isFallback) {
              fieldElement.classList.add('animate-highlight-orange')
            } else {
              fieldElement.classList.add('animate-highlight-green')
            }
          }

          onFill(data.suggestion)

          // Set appropriate status and message
          if (isFallback) {
            setStatus('error')
            setAnimation(null)
            showToast(`Using fallback content for ${field} (AI generation failed)`, 'warning')
          } else {
            setStatus('success')
            setAnimation('bounce')
            const message = isCached
              ? `Filled ${field} from cache`
              : `AI generated ${field} successfully!`
            showToast(message)
          }
        }
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle')
        setAnimation(null)
      }, 3000)

    } catch (error) {
      console.error('AI fill error:', error)
      setStatus('error')
      setAnimation(null)
      showToast('Failed to generate content', 'error')

      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        )
      case 'success':
        return (
          <>
            <Check className="h-4 w-4 mr-2 animate-bounce" />
            Filled!
          </>
        )
      case 'error':
        return (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Fallback Used
          </>
        )
      default:
        return variant === 'section' ? (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Fill All
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assist
          </>
        )
    }
  }

  const getButtonVariant = () => {
    switch (status) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700'
      case 'error':
        return 'bg-orange-600 hover:bg-orange-700'
      default:
        return variant === 'section' ? 'bg-purple-600 hover:bg-purple-700' : ''
    }
  }

  return (
    <Button
      onClick={handleAIFill}
      disabled={status === 'loading'}
      className={cn(
        'transition-all duration-300 transform',
        getButtonVariant(),
        animation === 'pulse' && 'animate-pulse',
        animation === 'bounce' && 'animate-bounce',
        status === 'success' && 'scale-105',
        className
      )}
      variant={variant === 'section' ? 'default' : 'eu'}
    >
      {getButtonContent()}
    </Button>
  )
}

// Toast notification helper
function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
  const toast = document.createElement('div')
  const bgColor = type === 'success' ? 'bg-green-600' :
                  type === 'error' ? 'bg-red-600' :
                  'bg-orange-600'

  toast.className = cn(
    'fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-slide-in-from-bottom',
    bgColor
  )
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('animate-fade-out')
    setTimeout(() => document.body.removeChild(toast), 500)
  }, 4000) // Show warning messages a bit longer
}

// Auto-complete entire project button
export function AutoCompleteButton({
  context,
  projectId,
  language = 'en',
  onComplete
}: {
  context: any
  projectId?: string
  language?: string
  onComplete: (data: Record<string, any>) => void
}) {
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [currentSection, setCurrentSection] = useState('')

  const sections = [
    { name: 'basic', fields: ['title', 'municipality', 'country', 'ipaWindow', 'description'] },
    { name: 'objectives', fields: ['objectives', 'smartSpecific', 'smartMeasurable', 'smartAchievable', 'smartRelevant', 'smartTimeBound'] },
    { name: 'methodology', fields: ['methodology', 'risks', 'sustainability'] },
    { name: 'budget', fields: ['budget', 'duration'] }
  ]

  const handleAutoComplete = async () => {
    setIsRunning(true)
    setProgress(0)
    const results: Record<string, any> = {}

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      setCurrentSection(section.name)
      setProgress((i / sections.length) * 100)

      try {
        const response = await fetch('/api/ai-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'fill-section',
            sectionName: section.name,
            fields: section.fields,
            context: { ...context, ...results },
            language,
            projectId
          })
        })

        if (response.ok) {
          const data = await response.json()
          Object.assign(results, data.results)
        }
      } catch (error) {
        console.error(`Error filling ${section.name}:`, error)
      }

      // Small delay between sections
      await new Promise(r => setTimeout(r, 1000))
    }

    setProgress(100)
    setCurrentSection('Complete!')
    onComplete(results)

    setTimeout(() => {
      setIsRunning(false)
      setProgress(0)
      setCurrentSection('')
    }, 3000)
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleAutoComplete}
        disabled={isRunning}
        className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 text-white"
        size="lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Generating Complete Application...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5 mr-2" />
            Generate Complete Application
          </>
        )}
      </Button>

      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Filling: {currentSection}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}