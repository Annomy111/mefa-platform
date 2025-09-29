// Define D1Database interface locally
interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement
  first<T = unknown>(): Promise<T | null>
  run(): Promise<D1Response>
  all<T = unknown>(): Promise<D1Result<T>>
}

interface D1Response {
  success: boolean
  meta: any
  error?: string
}

interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta: any
  error?: string
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1Response>
}

interface KVNamespace {
  get(key: string, options?: any): Promise<string | null>
  put(key: string, value: string, options?: any): Promise<void>
  delete(key: string): Promise<void>
  list(options?: any): Promise<any>
}

export interface CloudflareEnv {
  DB: D1Database
  SESSION_STORE: KVNamespace
  AI: any
  OPENROUTER_API_KEY: string
}

export class D1Adapter {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async getProject(id: string) {
    const result = await this.db
      .prepare('SELECT * FROM Project WHERE id = ?')
      .bind(id)
      .first()
    return result
  }

  async listProjects() {
    const result = await this.db
      .prepare('SELECT * FROM Project ORDER BY updatedAt DESC')
      .all()
    return result.results
  }

  async createProject(data: any) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => '?').join(', ')

    await this.db
      .prepare(
        `INSERT INTO Project (id, createdAt, updatedAt, ${keys.join(', ')})
         VALUES (?, ?, ?, ${placeholders})`
      )
      .bind(id, now, now, ...values)
      .run()

    return { id, ...data, createdAt: now, updatedAt: now }
  }

  async updateProject(id: string, data: any) {
    const now = new Date().toISOString()
    const updates = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ')

    await this.db
      .prepare(
        `UPDATE Project SET ${updates}, updatedAt = ? WHERE id = ?`
      )
      .bind(...Object.values(data), now, id)
      .run()

    return this.getProject(id)
  }

  async deleteProject(id: string) {
    await this.db
      .prepare('DELETE FROM Project WHERE id = ?')
      .bind(id)
      .run()
    return { success: true }
  }

  async getAICache(hash: string) {
    const result = await this.db
      .prepare('SELECT * FROM AICache WHERE hash = ?')
      .bind(hash)
      .first()

    if (!result) return null

    const cacheAge = Date.now() - new Date((result as any).createdAt as string).getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    if (cacheAge > maxAge) {
      await this.db
        .prepare('DELETE FROM AICache WHERE hash = ?')
        .bind(hash)
        .run()
      return null
    }

    return result
  }

  async setAICache(hash: string, data: any) {
    const now = new Date().toISOString()
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO AICache (hash, response, metadata, createdAt)
         VALUES (?, ?, ?, ?)`
      )
      .bind(hash, data.response, JSON.stringify(data.metadata || {}), now)
      .run()
  }

  async createAIResponse(data: any) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await this.db
      .prepare(
        `INSERT INTO AIResponse (id, projectId, field, prompt, response, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, data.projectId, data.field, data.prompt, data.response, now)
      .run()

    return { id, ...data, createdAt: now }
  }

  async getSession(id: string) {
    const result = await this.db
      .prepare('SELECT * FROM Session WHERE id = ?')
      .bind(id)
      .first()
    return result
  }

  async createSession(userId: string, data: any) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await this.db
      .prepare(
        `INSERT INTO Session (id, userId, data, createdAt)
         VALUES (?, ?, ?, ?)`
      )
      .bind(id, userId, JSON.stringify(data), now)
      .run()

    return { id, userId, data, createdAt: now }
  }

  async createPerformanceAssessment(data: any) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await this.db
      .prepare(
        `INSERT INTO PerformanceAssessment
         (id, projectId, relevanceScore, maturityScore, performanceScore,
          climateContribution, crossCuttingPriorities, indicators,
          recommendations, complianceStatus, assessmentDate, assessedBy, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.projectId,
        data.relevanceScore,
        data.maturityScore,
        data.performanceScore,
        data.climateContribution,
        data.crossCuttingPriorities,
        data.indicators,
        data.recommendations,
        data.complianceStatus,
        now,
        data.assessedBy || null,
        data.notes || null
      )
      .run()

    return { id, ...data, assessmentDate: now }
  }
}