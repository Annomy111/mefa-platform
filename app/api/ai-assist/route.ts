import { NextRequest, NextResponse } from 'next/server'
import { generateAIContent, autoFillSection } from '@/lib/ai-service'

// export const runtime = 'edge' // Disabled for static export

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { field, context, language = 'en', projectId, action = 'single' } = body

    // Handle auto-fill entire section
    if (action === 'fill-section') {
      const { sectionName, fields } = body

      const results = await autoFillSection(
        sectionName,
        fields,
        context,
        projectId
      )

      return NextResponse.json({
        success: true,
        results,
        source: 'ai'
      })
    }

    // Single field generation
    if (!field) {
      return NextResponse.json(
        { error: 'Field is required' },
        { status: 400 }
      )
    }

    const response = await generateAIContent({
      field,
      projectContext: context,
      language,
      projectId
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('AI Assist Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate content',
        suggestion: 'Please try again or check your connection.',
        source: 'error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check cache status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const field = searchParams.get('field')

    if (!field) {
      return NextResponse.json({
        status: 'ready',
        message: 'AI assistance available'
      })
    }

    // Could add cache stats here if needed
    return NextResponse.json({
      field,
      status: 'ready',
      cache: 'enabled'
    })

  } catch (error) {
    console.error('AI Status Error:', error)
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 500 }
    )
  }
}