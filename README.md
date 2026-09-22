# OGCraft — Dynamic Open Graph Images via API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-1.168-ff6b6b.svg)](https://tanstack.com/start)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com/)

> Generate beautiful, customizable social share cards on the fly for your blog, e-commerce, or app in milliseconds. One API URL. Zero infrastructure.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Interactive Playground** | Live 1200×630 preview with editable content, template & gradient controls |
| **Instant API URL** | Copy production-ready URLs with all parameters encoded |
| **PNG Download** | Export high-resolution OG images directly from the browser |
| **Code Integration Tabs** | Ready-to-paste snippets for HTML `<meta>`, Next.js Metadata API, cURL |
| **Email/Password + Google Auth** | Full auth flow: signup, login, forgot/reset password, email confirmation |
| **Secure API Keys** | Keys hashed with SHA-256, never exposed after creation, prefix + last-4 only |
| **Row-Level Security** | Every table protected by RLS policies — users only access their own data |
| **Dashboard** | Overview, API Keys management, Template Builder, Analytics, Billing |
| **Usage Tracking** | Monthly quotas, per-key last-used timestamps, plan limits |
| **Dark, High-Contrast UI** | Tailwind v4 semantic tokens, shadcn/ui, Lucide icons |
| **Responsive & Accessible** | Mobile-first, keyboard navigable, focus-visible, ARIA labels |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (recommended: [nvm](https://github.com/nvm-sh/nvm))
- A [Supabase](https://supabase.com) project

### Installation

```bash
# Clone the repository
git clone https://github.com/Juan1Meza2308/og-card-studio.git
cd og-card-studio

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

Open http://localhost:3000 — you should see the OGCraft landing page with the interactive playground.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | TanStack Start (React 19, SSR, File-based routing) |
| **Styling** | Tailwind CSS v4 (semantic tokens), shadcn/ui components |
| **Auth & Database** | Supabase (PostgreSQL + Row Level Security) |
| **Forms & Validation** | React Hook Form + Zod |
| **State & Data Fetching** | TanStack Query (React Query v5) |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Date Handling** | date-fns |
| **Build Tool** | Vite 8 + Rolldown |
| **Deployment Target** | Vercel (configurable) |

---

## 📁 Project Structure

```
og-card-studio/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── ogcraft/           # OGCraft-specific components
│   │   │   ├── dashboard.tsx  # Protected dashboard (5 views)
│   │   │   ├── logo.tsx       # Brand logo component
│   │   │   ├── marketing.tsx  # Landing page sections (nav, hero, features, pricing, footer)
│   │   │   └── playground.tsx # Interactive OG card editor
│   │   └── ui/                # shadcn/ui primitives (40+ components)
│   ├── hooks/
│   │   └── use-mobile.tsx     # Responsive breakpoint hook
│   ├── integrations/
│   │   └── supabase/          # Supabase clients & auth middleware
│   │       ├── client.ts      # Browser client
│   │       ├── client.server.ts # SSR client
│   │       ├── auth-middleware.ts
│   │       ├── cron-auth.ts
│   │       ├── previewAuthStorage.ts
│   │       └── types.ts       # Generated DB types
│   ├── lib/
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   └── utils.ts           # cn(), helpers
│   ├── routes/
│   │   ├── _authenticated/    # Protected routes (require auth)
│   │   │   ├── route.tsx      # Auth guard + user context
│   │   │   └── dashboard.tsx  # Dashboard page
│   │   ├── auth.tsx           # Login / Signup / Forgot password
│   │   ├── index.tsx          # Landing page
│   │   ├── playground.tsx     # Standalone playground page
│   │   ├── pricing.tsx        # Pricing page
│   │   ├── features.tsx       # Features page
│   │   ├── docs.tsx           # Documentation page
│   │   ├── reset-password.tsx # Password reset flow
│   │   ├── privacy.tsx        # Privacy policy
│   │   ├── status.tsx         # System status
│   │   ├── __root.tsx         # Root layout + metadata
│   │   └── routeTree.gen.ts   # Auto-generated route tree
│   ├── router.tsx             # Router configuration
│   ├── start.ts               # TanStack Start entry
│   ├── server.ts              # SSR server entry
│   ├── styles.css             # Global styles + Tailwind v4 tokens
│   └── routeTree.gen.ts
├── supabase/
│   └── migrations/            # Database schema + RLS policies
├── .env.example               # Environment template (no secrets)
├── AGENTS.md                  # Development standards
├── roadmap.md                 # Project roadmap
├── components.json            # shadcn/ui config
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Project URL from Supabase Dashboard → Settings → API |
| `SUPABASE_PUBLISHABLE_KEY` | ✅ | Anon/public key (safe for client) |
| `SUPABASE_PROJECT_ID` | ✅ | Project reference ID |
| `VITE_SUPABASE_URL` | ✅ | Same as above, for client bundle |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Same as above, for client bundle |
| `VITE_SUPABASE_PROJECT_ID` | ✅ | Same as above, for client bundle |
| `SUPABASE_SECRET_KEY` | ❌ | Service role key (server-only, never in client) |

> **Never commit `.env`**. Use `.env.example` as template.

---

## 🗄️ Database Schema (Supabase)

All tables have **Row Level Security (RLS) enabled** with policies restricting access to `auth.uid() = user_id`.

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profile & plan | `id` (PK, FK→auth.users), `display_name`, `avatar_url`, `plan` (free/pro/agency) |
| `api_keys` | Hashed API keys | `id`, `user_id`, `name`, `key_prefix`, `key_hash` (SHA-256), `last_four`, `status`, `last_used_at` |
| `usage_stats` | Monthly quota tracking | `id`, `user_id`, `period_start`, `requests_used`, `request_limit` |
| `templates` | User-defined OG templates | `id`, `user_id`, `name`, `theme`, `title`, `subtitle`, `logo_url`, `is_default` |

### Security Highlights

- **`handle_new_user()` trigger** — On signup, automatically creates:
  - Profile row with display name from OAuth metadata or email prefix
  - Starter usage row (42/100 requests used for demo)
  - Sample API key (`og_live_...`) — **hashed**, only prefix + last 4 stored
- **RLS Policies** — Every table has `SELECT/INSERT/UPDATE/DELETE` policies scoped to `auth.uid() = user_id`
- **No raw secrets** — API key secret is **never returned** after creation; only `key_prefix` + `last_four` shown

### Migrations

```bash
# Apply migrations to your Supabase project
supabase db push
# Or run SQL manually from supabase/migrations/
```

---

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel → Framework: **Other** → Build: `npm run build` → Output: `build`
3. Add environment variables from `.env.example`
4. Deploy

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "build/server/index.js"]
```

### Environment-Specific Notes

- **SSR**: TanStack Start renders HTML on the server for SEO-critical pages
- **Auth**: Supabase cookies work cross-subdomain; configure `Site URL` in Supabase Auth settings
- **Google OAuth**: Add `https://your-domain.com/auth/callback` to Authorized Redirect URIs in Google Cloud Console

---

## 🧪 Development

```bash
# Development server with HMR
npm run dev

# Type-check
npm run lint

# Format code
npm run format

# Production build
npm run build

# Preview production build locally
npm run preview
```

### Conventions

- **Microcommits**: Each logical change = one commit
- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `test:`
- **Author**: All commits by `Juan1Meza2308`
- **No AI traces**: No "generated by", "bot", "AI" in code/comments/commits

---

## 🗺️ Roadmap

See [roadmap.md](roadmap.md) for current status.

- [x] Enable authentication and secure account data
- [x] Build public landing page and interactive OG playground
- [x] Build email/Google authentication and password recovery
- [x] Build protected dashboard views and API key controls
- [x] Validate desktop and mobile flows
- [ ] Add Stripe billing integration (Pro/Agency plans)
- [ ] Implement actual OG image generation API endpoint
- [ ] Add team/workspace support for Agency plan
- [ ] Webhook notifications for usage limits

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m "feat: add amazing feature"`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

Please follow the code standards in [AGENTS.md](AGENTS.md).

---

## 📄 License

MIT License — Copyright (c) 2025 **Juan1Meza2308**

See [LICENSE](LICENSE) for details (or create one — MIT by default).

---

## 🙏 Acknowledgments

- [TanStack](https://tanstack.com/) for the incredible Start framework
- [Supabase](https://supabase.com/) for auth + database + RLS
- [shadcn/ui](https://ui.shadcn.com/) for accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide](https://lucide.dev/) for beautiful icons
- [Vercel](https://vercel.com/) for deployment platform

---

**Built with care by [Juan1Meza2308](https://github.com/Juan1Meza2308)**
