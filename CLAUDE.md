# VertragsCheck AI — Claude Code Projektspezifikation

## Projektüberblick

**VertragsCheck AI** ist eine Browser-basierte SaaS-App, die Verträge, AGBs und Vereinbarungen per KI analysiert. Zielgruppe: Freelancer, Selbstständige und KMUs, die Verträge verstehen wollen — ohne Anwalt.

**Tech-Stack:**

- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui
- Backend: Node.js + Express (REST API)
- KI: Anthropic Claude API (`claude-sonnet-4-20250514`)
- DB: SQLite (lokal) → später Supabase/Dataverse
- Auth: Clerk (Freemium-Gate) oder einfaches JWT-Auth
- PDF-Parsing: pdf-parse (Node.js)
- Payments (Phase 2): Stripe

**Monetarisierung:** Freemium

- Free: 3 Analysen/Monat, max. 10 Seiten
- Pro (€19/Monat): Unbegrenzt, alle Features
- Business (€49/Monat): Team + API

-----

## Projektstruktur

```
vertragscheck/
├── CLAUDE.md                    ← diese Datei
├── README.md
├── .env.example
├── .gitignore
│
├── frontend/                    ← React App (Vite)
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── upload/
│   │   │   │   ├── DropZone.tsx          ← Drag & Drop Upload
│   │   │   │   └── UploadProgress.tsx
│   │   │   ├── analysis/
│   │   │   │   ├── AnalysisView.tsx      ← Haupt-Analyse-Ansicht
│   │   │   │   ├── RiskBadge.tsx         ← Rot/Gelb/Grün Risiko-Badge
│   │   │   │   ├── ClauseCard.tsx        ← Einzelne Klausel-Karte
│   │   │   │   ├── RiskSummary.tsx       ← Zusammenfassung oben
│   │   │   │   └── ExportButton.tsx      ← PDF-Export (Pro)
│   │   │   ├── freemium/
│   │   │   │   ├── UpgradeModal.tsx      ← Paywall-Modal
│   │   │   │   └── UsageCounter.tsx      ← "2/3 Analysen genutzt"
│   │   │   └── ui/                       ← shadcn/ui Komponenten
│   │   ├── pages/
│   │   │   ├── Home.tsx                  ← Landing/Upload
│   │   │   ├── Analysis.tsx              ← Ergebnis-Seite
│   │   │   ├── Dashboard.tsx             ← Analyse-Verlauf
│   │   │   └── Pricing.tsx               ← Preispläne
│   │   ├── hooks/
│   │   │   ├── useAnalysis.ts            ← API-Calls + State
│   │   │   ├── useUsageLimit.ts          ← Freemium-Logik
│   │   │   └── useUser.ts
│   │   ├── lib/
│   │   │   ├── api.ts                    ← Axios-Client
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts                  ← Shared TypeScript Types
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/                     ← Express API
    ├── src/
    │   ├── index.ts              ← Server-Einstiegspunkt
    │   ├── routes/
    │   │   ├── analysis.ts       ← POST /api/analyze
    │   │   ├── documents.ts      ← GET/DELETE /api/documents
    │   │   └── user.ts           ← GET /api/user/usage
    │   ├── services/
    │   │   ├── claude.ts         ← Anthropic API Integration
    │   │   ├── pdfParser.ts      ← PDF → Text Extraktion
    │   │   └── usageTracker.ts   ← Freemium-Limits
    │   ├── middleware/
    │   │   ├── auth.ts
    │   │   └── rateLimit.ts
    │   ├── db/
    │   │   ├── schema.sql        ← SQLite Schema
    │   │   └── client.ts
    │   └── types/
    │       └── index.ts
    ├── package.json
    └── tsconfig.json
```

-----

## Kern-Features (MVP — Phase 1)

### Feature 1: Dokument-Upload (DropZone)

- Drag & Drop oder Datei-Dialog
- Unterstützte Formate: PDF, DOCX, TXT
- Max. Dateigröße: 10 MB (Free), 50 MB (Pro)
- Upload-Progress-Anzeige
- Fehlerbehandlung: zu groß, falsches Format, zu viele Seiten

### Feature 2: KI-Analyse (Kernfunktion)

- Text-Extraktion aus Dokument
- Streaming-Response von Claude API (sichtbarer Fortschritt)
- Output-Struktur (JSON):
  
  ```typescript
  interface AnalysisResult {
    summary: string;              // 2-3 Sätze Zusammenfassung
    overallRisk: 'low' | 'medium' | 'high';
    clauses: Clause[];
    recommendations: string[];
  }
  
  interface Clause {
    id: string;
    title: string;               // z.B. "Haftungsausschluss"
    originalText: string;        // Original-Klausel
    plainExplanation: string;    // Einfache Erklärung
    risk: 'low' | 'medium' | 'high';
    riskReason: string;          // Warum ist es riskant?
    suggestion?: string;         // Verbesserungsvorschlag (Pro)
  }
  ```

### Feature 3: Analyse-Ansicht

- Gesamt-Risiko-Banner (grün/gelb/rot) ganz oben
- Kurz-Zusammenfassung in Alltagssprache
- Liste aller analysierten Klauseln als Cards
  - Farbkodierung: grün (OK), gelb (prüfen), rot (Achtung)
  - Aufklappbar: Originaltext ↔ Erklärung
  - Verbesserungsvorschlag (nur Pro, sonst Paywall-Blur)
- Sticky Sidebar mit Risiko-Übersicht

### Feature 4: Freemium-Gate

- Nutzungs-Zähler im Header: “2 von 3 Analysen genutzt”
- Nach 3. Analyse → UpgradeModal (kein Hard-Block, sondern weicher Prompt)
- Pro-Features visuell sichtbar aber gesperrt (Blur + Lock-Icon)
- Preisseite mit Stripe-Integration vorbereitet (Phase 2)

### Feature 5: Export (Pro)

- PDF-Report-Download mit Branding
- Enthält: Summary, alle Klauseln mit Bewertungen, Empfehlungen

-----

## API-Endpunkte

### POST /api/analyze

```
Request:
  Content-Type: multipart/form-data
  Body: { file: File, userId: string }

Response (Streaming JSON):
  { status: 'processing', progress: 0-100 }
  { status: 'complete', result: AnalysisResult }

Errors:
  400: Dateiformat nicht unterstützt
  413: Datei zu groß
  429: Freemium-Limit erreicht
  500: Claude API Fehler
```

### GET /api/documents

```
Response:
  { documents: Document[] }

Document: { id, filename, uploadedAt, overallRisk, summary }
```

### GET /api/user/usage

```
Response:
  { used: number, limit: number, plan: 'free' | 'pro' | 'business' }
```

-----

## Claude API — System-Prompt (claude.ts)

```typescript
const SYSTEM_PROMPT = `Du bist ein Vertragsanalyse-Assistent. Analysiere den folgenden Vertragstext und gib eine strukturierte JSON-Antwort zurück.

Regeln:
- Erkläre jede Klausel in einfacher, verständlicher Sprache (kein Juristendeutsch)
- Bewerte das Risiko: "low" (Standard, unbedenklich), "medium" (prüfen empfohlen), "high" (potenziell nachteilig)
- Sei konkret und spezifisch — keine generischen Warnungen
- Sprache der Antwort: Deutsch
- Antworte NUR mit validem JSON, kein Markdown, keine Erklärungen außerhalb des JSON

JSON-Schema:
{
  "summary": "string (2-3 Sätze, was ist dieser Vertrag?)",
  "overallRisk": "low|medium|high",
  "clauses": [
    {
      "id": "string",
      "title": "string (Klausel-Bezeichnung)",
      "originalText": "string (relevanter Originaltext, max. 200 Zeichen)",
      "plainExplanation": "string (Erklärung in Alltagssprache)",
      "risk": "low|medium|high",
      "riskReason": "string (warum dieses Risiko?)",
      "suggestion": "string (konkrete Verbesserung, optional)"
    }
  ],
  "recommendations": ["string"]
}`;
```

-----

## Umgebungsvariablen (.env)

```env
# Backend
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
DATABASE_URL=./data/vertragscheck.db
JWT_SECRET=your-secret-here

# Frontend
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=VertragsCheck AI

# Stripe (Phase 2)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

-----

## Datenbank-Schema (SQLite)

```sql
-- Nutzer
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  plan TEXT DEFAULT 'free',        -- 'free' | 'pro' | 'business'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analysen
CREATE TABLE analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  filename TEXT NOT NULL,
  file_size INTEGER,
  overall_risk TEXT,               -- 'low' | 'medium' | 'high'
  result_json TEXT,                -- Vollständiges AnalysisResult als JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Nutzungs-Tracking (für Freemium-Limits)
CREATE TABLE usage (
  user_id TEXT REFERENCES users(id),
  month TEXT NOT NULL,             -- Format: '2026-03'
  analysis_count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, month)
);
```

-----

## Implementierungs-Reihenfolge (empfohlen)

### Sprint 1 (Woche 1–2): Kern-Backend

1. Express-Server + TypeScript aufsetzen
1. SQLite-Datenbank + Schema
1. PDF-Parser Service (pdf-parse)
1. Claude API Integration mit Streaming
1. POST /api/analyze Endpunkt

### Sprint 2 (Woche 3–4): React-Frontend

1. Vite + React + TypeScript + Tailwind Setup
1. DropZone-Komponente (react-dropzone)
1. API-Client (axios)
1. AnalysisView mit ClauseCards
1. RiskBadge-Komponente

### Sprint 3 (Woche 5–6): Freemium + Polish

1. Auth (JWT oder Clerk)
1. UsageTracker + Freemium-Gate
1. UpgradeModal
1. Dashboard (Analyse-Verlauf)
1. Responsive Design + Mobile

### Sprint 4 (Woche 7–8): Monetarisierung

1. Stripe-Integration
1. PDF-Export (Pro-Feature)
1. Pricing-Page
1. E-Mail-Bestätigung (Resend.com)
1. Deployment (Vercel Frontend + Railway/Render Backend)

-----

## Wichtige Abhängigkeiten

### Frontend (package.json)

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "axios": "^1.6",
    "react-dropzone": "^14",
    "react-pdf": "^7",
    "tailwindcss": "^3",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-badge": "latest",
    "lucide-react": "latest",
    "clsx": "latest"
  },
  "devDependencies": {
    "typescript": "^5",
    "vite": "^5",
    "@types/react": "^18"
  }
}
```

### Backend (package.json)

```json
{
  "dependencies": {
    "express": "^4",
    "@anthropic-ai/sdk": "^0.24",
    "pdf-parse": "^1.1",
    "mammoth": "^1.7",
    "multer": "^1.4",
    "better-sqlite3": "^9",
    "jsonwebtoken": "^9",
    "cors": "^2",
    "dotenv": "^16",
    "zod": "^3"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsx": "^4",
    "@types/express": "^4",
    "@types/node": "^20"
  }
}
```

-----

## Design-Prinzipien

- **Farbsprache konsequent:** Rot = Gefahr, Gelb = Vorsicht, Grün = OK — überall gleich
- **Progressive Disclosure:** Erst Summary, dann Details auf Klick
- **Vertrauen aufbauen:** “Wir speichern Ihren Vertrag nur für die Analyse” deutlich kommunizieren
- **Mobile-first:** Viele Nutzer auf dem Handy (Mietverträge etc.)
- **Ladezeit:** Streaming-Response nutzen — Nutzer sieht sofortigen Fortschritt

-----

## Nicht im MVP (Phase 2+)

- Mehrsprachige Unterstützung (EN, FR)
- Vertragsvergleich (zwei Versionen)
- Browser-Extension
- Power Platform Custom Connector
- Slack/Teams-Integration
- Vertrags-Vorlagen-Bibliothek
- DATEV-Export für steuerrelevante Klauseln
