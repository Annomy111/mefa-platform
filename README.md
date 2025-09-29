# MEFA Platform

**Municipal EU Funds Application Assistant**

An intelligent platform helping Western Balkans municipalities access EU IPA III funding with AI-assisted application forms, real-time compliance tracking, and multi-language support.

## 🌟 Features

- **AI-Assisted Form Completion**: Smart field suggestions using OpenRouter/Grok AI
- **8-Language Support**: Albanian, Bosnian, Croatian, English, Macedonian, Montenegrin, Serbian, Turkish
- **Real-Time Compliance Tracking**: Live scoring based on EU IPA III requirements
- **Auto-Save**: Never lose your progress with automatic cloud sync
- **Smart Context Awareness**: AI remembers all previously filled fields for coherent applications

## 🚀 Live Demo

**Production:** https://mefa-platform.pages.dev

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Deployment:** Cloudflare Pages + Workers
- **Database:** Cloudflare D1 (SQLite)
- **ORM:** Prisma
- **AI:** OpenRouter API (Grok 4 Fast)
- **UI:** Radix UI + Tailwind CSS
- **State:** Zustand with persistence
- **i18n:** next-intl

## 📦 Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.production .env
# Add your OPENROUTER_API_KEY

# Initialize database
npx prisma migrate dev

# Start development server
npm run dev
```

Visit http://localhost:3000

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## 🚢 Deployment

### Cloudflare Pages (Recommended)

```bash
# Build for Cloudflare
npm run build:cf

# Deploy
npm run deploy:cf
```

See [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for detailed deployment instructions.

### Environment Variables

```env
DATABASE_URL="file:./mefa.db"
OPENROUTER_API_KEY="your-api-key"
NODE_ENV="production"
```

## 📚 Project Structure

```
mefa-working/
├── app/                    # Next.js app directory
│   ├── [locale]/          # Internationalized routes
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions & services
│   ├── ai-service.ts     # AI integration
│   ├── translations.ts   # i18n translations
│   └── db.ts             # Database client
├── stores/                # Zustand state management
├── prisma/                # Database schema & migrations
└── public/                # Static assets
```

## 🎯 Key Features Implementation

### AI Context-Aware Suggestions

AI maintains context of all filled fields to provide coherent suggestions:

```typescript
const context = getProjectContext() // All filled fields
const suggestion = await aiService.generate(field, context, language)
```

### Real-Time Compliance Scoring

Automatic calculation based on field completion and quality:

```typescript
const score = calculateCompliance()
// Considers: required fields, quality, completeness
```

### Auto-Save with Conflict Resolution

Changes sync to cloud every 2 seconds:

```typescript
useEffect(() => {
  const timer = setTimeout(saveToDatabase, 2000)
  return () => clearTimeout(timer)
}, [project])
```

## 🌍 Supported Languages

- 🇬🇧 English
- 🇦🇱 Albanian (Shqip)
- 🇧🇦 Bosnian (Bosanski)
- 🇭🇷 Croatian (Hrvatski)
- 🇲🇰 Macedonian (Македонски)
- 🇲🇪 Montenegrin (Crnogorski)
- 🇷🇸 Serbian (Српски)
- 🇹🇷 Turkish (Türkçe)

## 📖 Documentation

- [Cloudflare Setup Guide](./CLOUDFLARE_SETUP.md)
- [Implementation Summary](./IMPLEMENTATION-SUMMARY.md)
- [Claude Code Instructions](./CLAUDE.md)

## 🤝 Contributing

This project is part of the Green Mayors initiative supporting EU integration in Western Balkans.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- AI powered by OpenRouter & xAI Grok
- Deployed on Cloudflare Pages

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** September 2025