![DADJ-MS Project Vision](https://i.ibb.co/N2T7K2R3/5.png)

# Dad J’s Auto Shop (DADJ-MS) Management System

A modern, all-in-one inventory and finance management system built to streamline operations, simplify accounting, and future-proof Dad J’s Auto Shop—empowering the Arce family to manage their car repair business with clarity, efficiency, and confidence.

---

## ⚙️ Tech Stack

This project is built as a Monorepo, combining a fast frontend with a modern, scalable backend and database solution.

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Client (Frontend)** | **Vue.js** (w/ Pinia & Router) | Interactive, component-based Single Page Application (SPA). |
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