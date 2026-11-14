# FINDIT – Smart Campus Lost & Found 🎓🔍

[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v13-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Live_Demo-22c55e?logo=github)](https://mehdi7869.github.io/findit/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> A modern, intelligent lost and found web platform tailored for university campuses. **FINDIT** connects students, faculty, and campus security through an automated multi-factor matching engine, anti-fraud verification workflows, and real-time alerts.

---

## 🌐 Live Demo & Repository

- **Live Application (GitHub Pages):** [https://mehdi7869.github.io/findit/](https://mehdi7869.github.io/findit/)
- **GitHub Repository:** [https://github.com/Mehdi7869/findit](https://github.com/Mehdi7869/findit)

---

## ✨ Key Features

### 🔍 Multi-Factor Matching Engine
- **Weighted Similarity Scoring:** Computes high-confidence matches by evaluating Category (22%), Title/Keywords (35%), Description (15%), Location (13%), Date delta (8%), and Physical Characteristics (7%).
- **Campus Zone Proximity Graph:** Built-in campus topological adjacency map (e.g., *Main Library* ↔ *Student Commons* ↔ *Lecture Hall Complex*) to calculate physical proximity scores.
- **Match Confidence Tiers:** Highlights matches into *High Confidence (80%+)*, *Moderate Match (60-79%)*, and *Potential Match (40-59%)*.

### 📋 Lost & Found Reporting
- **Report Lost:** Quick report flow for misplaced items with category, description, last-seen location, date, and contact preferences.
- **Report Found:** Streamlined flow for good Samaritans and campus staff to log found items and safe hand-off locations.
- **Verification Challenge Questions:** Found item posters can set secret challenge questions (e.g., *"What is the phone case sticker?"*) to prevent fraudulent claims.

### 🛡️ Claim Verification & Security
- **Anti-Fraud Claim Process:** Claimants must submit answer verification questions or upload proof of ownership.
- **Secure Custody Workflow:** Transparent state machine (`open` → `matched` → `claim_pending` → `returned` → `closed`).
- **Campus Admin & Security Portal:** Dedicated view for campus security personnel to oversee dispute resolutions, verify claims, and inspect audit logs.

### ⚡ Real-Time Collaboration & Communication
- **Live Notifications:** In-app notifications for item status changes, candidate matches, and claim approvals.
- **Campus Support Desk:** In-app ticket submission and resolution system for lost student IDs, keys, and high-value electronics.
- **Role-Based Profiles:** Differentiated experiences for students, faculty, and administrators.

---

## 🛠️ Tech Stack

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/), [Motion (Framer Motion)](https://motion.dev/)
- **3D & Visuals:** [Three.js](https://threejs.org/) (Interactive 3D logo and canvas mark)
- **Backend & Database:** [Firebase Firestore](https://firebase.google.com/docs/firestore), [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Deployment:** [GitHub Pages](https://pages.github.com/) & GitHub Actions

---

## 📂 Project Structure

```text
findit/
├── .github/workflows/      # Automated GitHub Actions (GitHub Pages deployment)
├── src/
│   ├── components/         # Reusable UI components (Layout, LogoMark, MatchScoreDisplay)
│   ├── context/            # AuthContext & User state management
│   ├── firebase/           # Firebase client initialization & config
│   ├── hooks/              # Custom data hooks (useFinditData)
│   ├── pages/              # Application pages
│   │   ├── AdminPage.tsx          # Campus security & admin portal
│   │   ├── AuthPage.tsx           # Sign-in / registration
│   │   ├── BrowseItemsPage.tsx    # Search & browse all open items
│   │   ├── DashboardPage.tsx      # Main user dashboard & stats
│   │   ├── ItemDetailPage.tsx     # Item specifics & claim modal
│   │   ├── MyClaimsPage.tsx       # Track submitted claims
│   │   ├── MyReportsPage.tsx      # View and manage your reported items
│   │   ├── NotificationsPage.tsx  # In-app notifications
│   │   ├── ProfilePage.tsx        # Campus profile & contact details
│   │   ├── ReportFoundPage.tsx    # Found item report wizard
│   │   ├── ReportLostPage.tsx     # Lost item report wizard
│   │   └── SupportPage.tsx        # Helpdesk and ticket support
│   ├── services/           # Firestore API & Matching algorithm
│   │   ├── finditApi.ts           # CRUD operations for reports, claims & tickets
│   │   └── matchingEngine.ts      # Multi-factor algorithmic matching engine
│   ├── types/              # TypeScript definitions & data models
│   ├── App.tsx             # Root router & layout configuration
│   └── main.tsx            # Application entrypoint
├── firestore.rules         # Granular Firebase Firestore security rules
├── firebase-blueprint.json # Schema specification for collections
├── index.html              # HTML shell
├── package.json            # Node dependencies and scripts
└── vite.config.ts          # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/Mehdi7869/findit.git
cd findit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` or `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 5. Build for Production

```bash
npm run build
npm run preview
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
