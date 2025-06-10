import { DurableObject } from 'cloudflare:workers'

export interface SessionData {
  userId: string
  userName: string
  lastActivity: string
  activeRooms: string[]
}

export class UserSession extends DurableObject {
  private sessionData: SessionData | null = null

  async fetch(request: Request) {
    const url = new URL(request.url)
    
    switch (request.method) {
      case 'GET':
        return this.getSession()
      case 'PUT':
        return this.updateSession(request)
      case 'DELETE':
        return this.deleteSession()
      default:
        return new Response('Method not allowed', { status: 405 })
    }
  }

  async getSession() {
    if (!this.sessionData) {
      this.sessionData = await this.ctx.storage.get<SessionData>('session') || null
    }

    if (!this.sessionData) {
      return new Response('Session not found', { status: 404 })
    }

    return new Response(JSON.stringify(this.sessionData), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async updateSession(request: Request) {
    try {
      const data = await request.json() as Partial<SessionData>
      
      if (!this.sessionData) {
        this.sessionData = {
          userId: data.userId!,
          userName: data.userName!,
          lastActivity: new Date().toISOString(),
          activeRooms: data.activeRooms || [],
        }
      } else {
        this.sessionData = {
          ...this.sessionData,
          ...data,
          lastActivity: new Date().toISOString(),
        }
      }

      await this.ctx.storage.put('session', this.sessionData)

      return new Response(JSON.stringify(this.sessionData), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      return new Response('Invalid request body', { status: 400 })
    }
  }

  async deleteSession() {
    await this.ctx.storage.delete('session')
    this.sessionData = null
    return new Response('Session deleted', { status: 200 })
  }

  async alarm() {
    // Clean up inactive sessions after 24 hours
    if (this.sessionData) {
      const lastActivity = new Date(this.sessionData.lastActivity)
      const now = new Date()
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceActivity > 24) {
        await this.deleteSession()
      }
    }
  }
}