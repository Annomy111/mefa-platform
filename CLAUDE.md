# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MEFA Platform - EU IPA III funding application system for Western Balkans municipalities. A Next.js application with AI-assisted form completion, real-time compliance tracking, and multi-language support.

## Development Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000

# Building and Production
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run all Jest tests
npm run test:e2e     # Run E2E tests for MEFA features

# Linting
npm run lint         # Run Next.js linter

# Database
npx prisma migrate dev    # Run migrations in development
npx prisma studio         # Open Prisma Studio for database inspection
npx prisma generate       # Regenerate Prisma Client after schema changes
```

## Architecture

### State Management
- **Zustand store** (`stores/project-store.ts`): Global state with persistence, auto-save functionality, and real-time compliance scoring. Store persists to localStorage and syncs with database every 2 seconds.

### Database Layer
- **Prisma + SQLite**: Local database at `./mefa.db`
- Models: `Project`, `AIResponse`, `Session`, `AICache`
- AI responses cached for 24 hours to reduce API calls
- Auto-save mechanism updates database every 2 seconds when changes detected

### AI Integration
- **OpenRouter API** with Grok 4 Fast model (free tier)
- Context-aware prompts that reference all previously filled fields
- Smart caching system using SHA256 hashes of field + context
- AI service at `lib/ai-service.ts` handles all AI interactions
- API endpoint: `/api/ai-assist` for client-side requests

### Component Structure
- Main app: `app/municipality/project-builder/enhanced-page.tsx`
- UI components in `components/ui/` using Radix UI primitives
- Custom AI fill button: `components/ai-fill-button.tsx`
- Tabbed interface: Basic Info → Objectives → Methodology → Budget → Review

### Key Features
1. **Context-Aware AI**: AI remembers and references all previously filled fields
2. **Visual Feedback**: Green glow animation when AI fills fields
3. **Compliance Scoring**: Real-time calculation based on field completion
4. **Multi-language Support**: 8 Western Balkans languages
5. **Auto-save**: Changes persist automatically after 2 seconds

## API Routes

- `POST /api/ai-assist`: Generate AI content for a field
  - Body: `{ field, projectContext, language, projectId? }`
  - Returns: `{ suggestion, cached, source }`

- `GET/POST /api/projects`: Project CRUD operations
  - GET: List all projects
  - POST: Create/update project with auto-save

## Environment Variables

Required in `.env`:
```
DATABASE_URL="file:./mefa.db"
OPENROUTER_API_KEY="your-api-key"
```

## Testing Approach

- Unit tests: Jest with React Testing Library
- E2E tests: Puppeteer for browser automation
- Test files located in `tests/` directory
- Coverage reports in `coverage/` directory