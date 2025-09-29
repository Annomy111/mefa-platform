import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'edge'

const PROJECTS_FILE = path.join(process.cwd(), 'data', 'projects.json')

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function readProjects() {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeProjects(projects: any[]) {
  await ensureDataDir()
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2))
}

// GET all projects or specific project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const projects = await readProjects()

    if (id) {
      const project = projects.find((p: any) => p.id === id)
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      return NextResponse.json(project)
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error reading projects:', error)
    return NextResponse.json({ error: 'Failed to read projects' }, { status: 500 })
  }
}

// POST new project
export async function POST(request: NextRequest) {
  try {
    const project = await request.json()
    const projects = await readProjects()

    const newProject = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    }

    projects.push(newProject)
    await writeProjects(projects)

    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error('Error saving project:', error)
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 })
  }
}

// PUT update project
export async function PUT(request: NextRequest) {
  try {
    const { id, ...projectData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const projects = await readProjects()
    const index = projects.findIndex((p: any) => p.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    projects[index] = {
      ...projects[index],
      ...projectData,
      id,
      updatedAt: new Date().toISOString()
    }

    await writeProjects(projects)

    return NextResponse.json(projects[index])
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// DELETE project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const projects = await readProjects()
    const filtered = projects.filter((p: any) => p.id !== id)

    if (projects.length === filtered.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await writeProjects(filtered)

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}