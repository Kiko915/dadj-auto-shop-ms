<p align="center">
  <img src="https://i.ibb.co/N2T7K2R3/5.png" alt="DADJ-MS Project Vision">
</p>

# Dad J’s Auto Shop (DADJ-MS) Management System

A modern, all-in-one inventory and finance management system built to streamline operations, simplify accounting, and future-proof Dad J’s Auto Shop—empowering the Arce family to manage their car repair business with clarity, efficiency, and confidence.

---

## ⚙️ Tech Stack

This project is built as a Monorepo, combining a fast frontend with a modern, scalable backend and database solution.

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Client (Frontend)** | **Vue.js** (w/ Pinia & Router) | Interactive, component-based Single Page Application (SPA). |
| **Mobile (Wrapper)** | **Capacitor** | Wraps the web `client` into native Android/iOS apps with minimal changes; enables native plugins (microphone, file access). |
| **NLP / AI** | **OpenAI / Hugging Face / Dialogflow (optional)** | Cloud or managed NLP services for voice-to-intent, summarization, and extraction (used via a secure server proxy). |
| **Server (Backend)** | **Node.js** (w/ Express, ES Modules) | Fast, non-blocking API layer. |
| **Database (DB)** | **PostgreSQL** (via **NeonDB**) | Scalable, cloud-hosted, serverless relational data store. |
| **ORM / Data** | **Prisma** (w/ Neon Adapter) | Modern ORM for type-safe and reliable database access. |
| **Code Quality** | **ESLint** & **Prettier** | Enforces consistent code style and error prevention. |
| **Testing** | **Vitest** (Unit/Component) & **Playwright** (E2E) | Comprehensive testing strategy for reliability. |

---

## 🚀 Getting Started (Quick Setup Guide)

Follow these steps to get the entire full-stack application running on your local machine.

### Prerequisites

1.  Node.js (LTS version)
2.  PostgreSQL knowledge (Basic)
3.  Your **NeonDB** connection string.

### 1. Repository Setup

Clone the repository and install dependencies in **both** the client and server directories.

```bash
# 1. Clone the repository
git clone [YOUR_REPO_URL] dadj-ms
cd dadj-ms

# 2. Install dependencies for the Client (Vue.js)
cd client
npm install

# 3. Install dependencies for the Server (Node.js/Prisma)
cd ../server
npm install

---

## 📱 Mobile + NLP Prototype

This project can be wrapped with Capacitor to produce native Android/iOS apps while reusing the existing `client` web app. For a short-term, high-impact NLP prototype we recommend a "Voice → Create Estimate" flow: capture voice, convert to text, send to a server-side NLP endpoint (OpenAI / Hugging Face / Dialogflow), then populate the estimate form.

Quick steps (prototype):

1. In `client`, add Capacitor and scaffold platforms:

```bash
cd client
npx cap init dadj-ms com.example.dadjms
npm run build                       # ensure web assets are ready
npx cap add android                 # or ios
npx cap copy
```

2. Capture voice/text in the app:
- For fast web prototype: use the Web Speech API (`SpeechRecognition`) in the browser.
- For native: use `@capacitor-community/speech-recognition` or Capacitor's plugins.

3. Implement a secure server proxy in `server`:
- Add an endpoint like `POST /api/nlp` that accepts text and calls the chosen NLP API (store API keys only on the server).

4. Minimal NLP flow:
- Client sends captured text to `server` → `server` calls OpenAI/HuggingFace → returns structured JSON (customer, vehicle, services, parts) → client fills the estimate form.

5. Security & testing:
- Do NOT store provider API keys in the mobile app. Keep keys in `server` environment variables.
- Test the web flow first (`npm run dev` in `client`) before running on device/emulator.

Estimated time: 2–5 days for a working prototype (voice capture + OpenAI extraction + auto-fill). If you want, I can scaffold the Capacitor setup and add a minimal voice UI that hits a new `server` endpoint.

See the `client` and `server` folders for development commands and existing API routes.

