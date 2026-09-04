# CuraVault 🛡️ — Secure Medical Intelligence

[![Vercel Deploy](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://cura-vault.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**CuraVault** is a next-generation healthcare web application prototype that turns static medical records into actionable, intelligent insights. It features a premium, ultra-minimalist UI (inspired by Vercel and Apple Health) and uses simulated AI pipelines to extract text, manage access tokens, and organize clinical histories.

**Live Demo:** [https://cura-vault.vercel.app](https://cura-vault.vercel.app)

---

## ✨ Features

- **Upload & Ingestion Pipeline:** A sleek 5-step interactive pipeline tracking document progress (Upload → Storage → OCR → AI Extract → Validation).
- **Medical Timeline Dashboard:** Chronological view of all uploaded records intelligently categorized (Lab Reports, Prescriptions, Discharge Summaries) with extracted entities visually tagged.
- **Semantic Search:** Natural language search powered by mock AI relevance scoring.
- **Provider Access Tokens:** Generate secure QR-coded URLs that expire in 30 minutes, allowing doctors temporary access to specific document categories.
- **Action Items & Reminders:** Automated extraction of follow-up tasks (e.g., upcoming appointments, prescription refills).
- **Premium Healthcare UI:** Extremely high-contrast "digital vault" aesthetic featuring floating glassmorphism navigation, soft grid overlays, and staggered cubic-bezier entrance animations.

## 🚀 Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend:** Next.js Serverless API Routes (formerly Express)
- **Icons & Graphics:** `lucide-react`, `react-qr-code`
- **Deployment:** Vercel (Edge-ready)
- **Data Layer:** Mock In-Memory Store (easily swappable for MongoDB / Supabase in production)

## 📁 Repository Structure

```text
CuraVault/
├── frontend/                 # Next.js Application (Full-Stack Monolith)
│   ├── src/app/              # UI Pages & Routing
│   │   ├── api/v1/           # Serverless Backend API Routes
│   │   ├── search/           # Semantic Search UI
│   │   ├── share/            # Access Token / QR UI
│   │   ├── reminders/        # Action Items UI
│   │   └── upload/           # Document Ingestion UI
│   └── globals.css           # Premium Tailwind Design System
├── docs/                     # Technical Specifications
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── AI_OCR_SPEC.md
│   └── DATABASE_SPEC.md
└── README.md                 # You are here!
```

## 🛠️ Local Development

Clone the repository and run it locally:

```bash
# 1. Clone the repo
git clone https://github.com/aryaman049/CuraVault.git
cd CuraVault

# 2. Enter the frontend workspace
cd frontend

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## 🧠 Documentation & Architecture

For a deeper dive into the theoretical architecture intended for production (MongoDB Atlas, Supabase Auth/Storage, Google Gemini OCR, LangChain chunking), refer to the `/docs` directory.

---
*Built with precision for modern medical document intelligence.*
