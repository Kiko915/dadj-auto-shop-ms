<p align="center">
  <img src="https://i.ibb.co/N2T7K2R3/5.png" alt="DADJ-MS Project Vision">
</p>

# Dad J's Auto Shop (DADJ-MS) Management System

A modern, all-in-one inventory and finance management system built to streamline operations, simplify accounting, and future-proof Dad J's Auto Shop — empowering the Arce family to manage their car repair business with clarity, efficiency, and confidence.

---

## Tech Stack

| Component | Technology | Notes |
| :--- | :--- | :--- |
| **Frontend** | Vue 3 + Vite + Pinia + Vue Router | SPA with component-based architecture |
| **UI** | Tailwind CSS v4 + shadcn-vue (Radix Vue) | Utility-first responsive design |
| **Mobile** | Capacitor (Android/iOS wrapper) | Wraps the web client; enables native plugins |
| **Backend** | Node.js + Express (ES Modules) | REST API on port `4000` |
| **Database** | PostgreSQL via NeonDB (serverless) | Cloud-hosted relational DB |
| **ORM** | Prisma + Neon Adapter | Type-safe DB access, migration tooling |
| **AI / NLP** | Groq (LLaMA 3.3 70B) + Google Gemini | Voice order parsing, diagnostic advisor, dashboard insights |
| **Auth** | JWT (Bearer tokens) | Stored in `localStorage`, verified via middleware |
| **Image Upload** | ImageKit | Avatars and vehicle photos |
| **Email** | Mailgun | Password reset and notifications |
| **Monitoring** | Sentry + New Relic | Error tracking and APM |

---

## Prerequisites

- **Node.js** LTS (v20+)
- **npm** v10+ (comes with Node.js LTS)
- A **NeonDB** connection string (PostgreSQL)
- API keys: Groq, Google Gemini, ImageKit, Mailgun (see [Environment Variables](#environment-variables))

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Kiko915/dadj-auto-shop-ms.git
cd dadj-auto-shop-ms
```

### 2. Install dependencies

Install dependencies for **both** the client and server separately.

```bash
# Client (Vue + Vite)
cd client
npm install

# Server (Express + Prisma)
cd ../server
npm install   # also runs prisma generate via postinstall
```

### 3. Configure environment variables

Create a `.env` file inside the `server/` directory. Copy the template below and fill in your values.

```env
# ── Database ─────────────────────────────────────────────
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"

# ── Auth ─────────────────────────────────────────────────
JWT_SECRET="your-strong-secret-here"

# ── Server ───────────────────────────────────────────────
PORT=4000
NODE_ENV=development

# ── Frontend (used for password-reset email links) ───────
FRONTEND_URL=http://localhost:5173

# ── Email (Mailgun) ──────────────────────────────────────
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain

# ── Image Uploads (ImageKit) ─────────────────────────────
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id

# ── AI / NLP ─────────────────────────────────────────────
GEMINI_API_KEY=your-google-gemini-api-key   # Dashboard AI Insights (primary)
GROQ_API_KEY=your-groq-api-key              # Voice Order + Diagnostic Advisor + Insights fallback

# ── Monitoring (optional, remove if unused) ───────────────
SENTRY_DSN=https://...@sentry.io/...
NEW_RELIC_APP_NAME=DADJ-Server
NODE_NR_LICENSE=your-new-relic-license-key
```

> **Note:** The client does **not** need a `.env` file. The Vite dev server proxies `/api/*` to `http://localhost:4000` automatically (configured in `client/vite.config.js`).

### 4. Set up the database

Run Prisma migrations to create the schema in your NeonDB instance.

```bash
cd server
npx prisma migrate deploy     # apply all existing migrations
npx prisma generate           # regenerate the Prisma client (if needed)
```

To create a new migration after editing `prisma/schema.prisma`:

```bash
npm run prisma:migrate -- <migration-name>
```

### 5. Seed an admin account (first-time setup)

```bash
cd server
node scripts/create-admin.js
```

---

## Running the App

Open **two terminals** — one for the server, one for the client.

### Terminal 1 — Server (API)

```bash
cd server
npm run dev        # starts nodemon on port 4000 with hot-reload
```

### Terminal 2 — Client (Frontend)

```bash
cd client
npm run dev        # starts Vite dev server on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Mobile (Capacitor — Android)

The web client is wrapped with Capacitor to produce native Android apps. Capacitor plugins currently in use: `@capacitor-community/speech-recognition` (voice orders).

### Build and sync to Android

```bash
cd client
npm run build                 # build the web assets into dist/
npm run cap:copy              # sync dist/ into the Android project
npm run cap:open:android      # open Android Studio
```

> Run on a device or emulator from Android Studio. Make sure the server is reachable (use your machine's LAN IP, not `localhost`, in `client/capacitor.config.json`).

### First-time Capacitor setup (already done, for reference)

```bash
cd client
npm run cap:init
npm run cap:add:android
```

---

## NLP / AI Features

See [`NLP_FEATURES.md`](NLP_FEATURES.md) for full documentation on:

- **Voice Order Assistant** — speak a service order; AI extracts customer, vehicle, and line items
- **AI Diagnostic Advisor** — type a complaint; AI returns ranked diagnoses and recommended service items
- **Dashboard AI Insights** — daily executive briefing powered by Gemini (Groq fallback), cached 30 minutes server-side and client-side

Both NLP features require a valid `GROQ_API_KEY`. The Dashboard Insights feature requires `GEMINI_API_KEY` (Groq is the fallback).

---

## Available Scripts

### Client (`cd client`)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite dev server (hot-reload) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Auto-fix ESLint issues |
| `npm run format` | Format source files with Prettier |
| `npm run test:unit` | Run unit tests with Vitest |
| `npm run test:e2e` | Run end-to-end tests with Playwright |

### Server (`cd server`)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start server with nodemon (hot-reload) |
| `npm run start` | Start server without hot-reload (production) |
| `npm run prisma:migrate -- <name>` | Create and apply a new DB migration |
| `npm run prisma:generate` | Regenerate Prisma client after schema changes |

---

## Project Structure

```
dadj-auto-shop-ms/
├── client/                  # Vue 3 + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios API wrappers
│   │   ├── components/      # Shared/UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── stores/          # Pinia state stores
│   │   └── router/          # Vue Router config
│   ├── android/             # Capacitor Android project
│   └── capacitor.config.json
│
├── server/                  # Express backend
│   ├── routes/              # API route handlers
│   ├── middleware/          # Auth, error handling
│   ├── prisma/              # Prisma schema + migrations
│   └── scripts/             # One-off admin scripts
│
└── NLP_FEATURES.md          # AI/NLP feature documentation
```

---

## Common Issues

| Problem | Fix |
| :--- | :--- |
| `prisma generate` fails | Make sure `DATABASE_URL` is set in `server/.env` |
| Client can't reach the API | Confirm the server is running on port `4000` |
| SSL error when pushing Git | Use `git -c http.sslVerify=false push origin <branch>` (school network issue) |
| Android can't reach localhost | Set `server` in `capacitor.config.json` to your machine's LAN IP (e.g. `192.168.x.x:4000`) |
| Microphone not working on Android | Grant microphone permission in device settings for the app |
| AI Insights not loading | Check that `GEMINI_API_KEY` and/or `GROQ_API_KEY` are set in `server/.env` |
