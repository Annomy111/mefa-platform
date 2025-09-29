import { NextRequest, NextResponse } from 'next/server';
import { validateProjectExcellence, validateField } from '@/lib/excellence-validation';

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectData, mode = 'full' } = body;

    if (mode === 'field') {
      // Single field validation
      const { fieldName, value } = body;
      if (!fieldName) {
        return NextResponse.json(
          { error: 'Field name is required for field validation' },
          { status: 400 }
        );
      }

      const validation = validateField(fieldName, value || '', projectData || {});

      return NextResponse.json({
        success: true,
        validation,
        timestamp: new Date().toISOString()
      });
    }

    // Full project validation
    if (!projectData) {
      return NextResponse.json(
        { error: 'Project data is required' },
        { status: 400 }
      );
    }

    const validationResult = validateProjectExcellence(projectData);

    return NextResponse.json({
      success: true,
      validation: validationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Validation Error:', error);
    return NextResponse.json(
      {
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // This could be extended to retrieve validation history for a project
    return NextResponse.json({
      status: 'ready',
      message: 'Real-time validation service available',
      features: [
        'Full project validation',
        'Field-level validation',
        'EU compliance checking',
        'Synergy detection',
        'Municipality intelligence integration',
        'Excellence scoring'
      ]
    });

  } catch (error) {
    console.error('Validation Status Error:', error);
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 500 }
    );
  }
}