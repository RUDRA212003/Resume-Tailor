# ResumeCraft – AI Resume Tailoring Studio

> **An evidence-based, privacy-first resume tailoring platform that guarantees zero hallucinations.**

ResumeCraft automates the repetitive and error-prone process of customizing your resume for specific job descriptions. Unlike generic generative AI tools that invent experience or fabricate skills, ResumeCraft strictly enforces **evidenced-based resume tailoring**: every generated bullet point, technology, and accomplishment must be grounded in your verified central profile repository.

---

## 🌟 Key Features

1. **Central Profile Repository (Single Source of Truth)**
   - Enter your personal details, summaries, skills, work experience, projects, education, and certifications once.
   - Maintain multiple approved summaries and granular bullet points with unique, permanent fact IDs.
   - Controlled skill-alias mapping (e.g., `JS = JavaScript`, `Postgres = PostgreSQL`).
   - Import existing resumes from PDF and DOCX files without silent overwrites.

2. **Job Description Requirement Analysis Engine**
   - Submit job postings via file upload (`PDF`, `DOCX`, `TXT`) or direct paste.
   - Analyzes mandatory skills, preferred skills, responsibilities, qualifications, and role keywords.
   - Transparent comparison matrix with status labels: *Available*, *Partially Matched*, *Not Present*, and *Requires Confirmation*.
   - Honest, explainable internal relevance estimate—no misleading "guaranteed ATS pass" claims or keyword stuffing.

3. **Strict Evidence-Based Tailoring Engine**
   - Integrates with **Google Gemini API** (`@google/genai`) with model selection (`gemini-3.8-flash`, `gemini-2.5-flash`).
   - Non-negotiable anti-hallucination layer: unverified skills in job descriptions are **never** fabricated.
   - Backend validation layer verifies every bullet against source fact IDs (`sourceFactIds`). Unsubstantiated claims are rejected and safely reverted.
   - Built-in intelligent deterministic fallback mode allows complete evaluation even without an API key.

4. **Privacy & Data Protection**
   - Automatic PII redaction: strips candidate name, email, phone number, and personal URLs before prompt transmission.
   - Personal contact details are rehydrated strictly upon final document assembly.
   - Permanent data wipe button in Settings.

5. **Split-Screen Review & Real-Time Diff**
   - Left side: High-fidelity rendered resume preview with Apple-inspired typography.
   - Right side: ATS matching breakdown, highlighted skills, and actionable recommendations.
   - **Ground Truth Diff View**: Clear comparison of rewritten statements, removed skills, and ordering changes.

6. **Resume Template Management & Multi-Format Export**
   - Built-in ATS-optimized templates: *Modern Minimalist*, *Executive Classic*, *Tech Clean*, and *Compact Single-Page*.
   - Upload custom DOCX templates with preserved section hierarchy.
   - Download pixel-perfect **DOCX** files (generated via `docx`) and vector **PDF** documents.

7. **Apple (India) Design System**
   - Palette: `#1D1D1F` (primary text), `#0066CC` (primary accent), `#0071E3` (secondary accent), `#2997FF` (highlight), `#F5F5F7` (light bg), `#FFFFFF` (white).
   - Border Radii: `8px`, `11px`, `980px`.
   - Typography: SF Pro Text, SF Pro Display, Metropolis, system sans.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Next.js Server-Side Route Handlers
- **AI Integration**: Google Gemini API via official `@google/genai` SDK
- **Document Processing**: `docx` for Word document generation, `mammoth` & `pdf-parse` for text extraction
- **Database & Persistence**: MongoDB Atlas / MongoDB Driver (`mongodb` v7) with connection pooling & local fallback
- **Validation**: Strict ground-truth fact verification engine

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ (tested on Node v22)
- **Package Manager**: `pnpm` or `npm`

### 2. Installation
```bash
# Clone or navigate to the repository
cd "Resume tailer tool"

# Install dependencies
pnpm install
```

### 3. Environment Setup
Create a `.env.local` file by copying the example template:
```bash
cp .env.example .env.local
```
Configure your environment variables:
```env
MONGODB_URI=your_mongodb_connection_string_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

### 4. Run the Development Server
```bash
pnpm dev
# or
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

Run the critical factual accuracy and document generation test suite:
```bash
npm test
```

### Critical Test Verifications:
1. **Unlisted Technology Detection**: Rejects any technology not verified in profile.
2. **Alias Resolution**: Resolves `JS` -> `JavaScript`, `Postgres` -> `PostgreSQL`.
3. **Fictional Company & Claim Rejection**: Rejects fabricated employment entries.
4. **Valid Fact ID Lineage**: Ensures every generated bullet cites genuine fact IDs.
5. **PII Sanitizer**: Confirms name, phone, email, and location are stripped before AI prompts.
6. **Profile Immutability**: Confirms central profile facts remain unchanged after resume tailoring.
7. **DOCX Generation**: Validates clean PK zip binary headers and valid Word formatting.

---

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/analyze-jd/route.ts       # Job description requirement analysis
│   │   │   ├── ai/tailor-resume/route.ts    # Evidence-based resume synthesis
│   │   │   ├── export/docx/route.ts         # Microsoft Word DOCX generator
│   │   │   └── parse-document/route.ts      # PDF & DOCX text extraction
│   │   ├── applications/page.tsx            # Saved applications tracker
│   │   ├── dashboard/page.tsx               # Studio dashboard with stats
│   │   ├── history/page.tsx                 # Generation audit log & fact reports
│   │   ├── profile/page.tsx                 # Central profile single source of truth
│   │   ├── settings/page.tsx                # AI provider & privacy settings
│   │   ├── tailor/page.tsx                  # Tailor engine & split-screen review
│   │   ├── templates/page.tsx               # Resume templates management
│   │   ├── globals.css                      # Apple Design System tokens & print styles
│   │   └── layout.tsx                       # Root layout
│   ├── components/
│   │   ├── layout/                          # Sidebar, Header, AppLayout
│   │   └── ui/                              # Apple-styled Button, Card, Badge
│   ├── lib/
│   │   ├── ai/                              # Gemini client, PII sanitizer, JD analyzer, tailor engine
│   │   ├── export/                          # DOCX and PDF exporters
│   │   ├── parser/                          # PDF and Word document parser
│   │   ├── storage/                         # Dual storage repository & seed data
│   │   └── verification/                    # Factual accuracy & anti-hallucination engine
│   └── types/                               # TypeScript domain schemas
├── supabase/
│   └── migrations/20261122_resumecraft.sql  # Supabase PostgreSQL schema with RLS
├── tests/
│   ├── factualAccuracy.test.mjs             # Non-negotiable fact-checking tests
│   └── documentProcessing.test.mjs          # DOCX & parsing tests
├── package.json
└── tsconfig.json
```

---

## 🔒 Security & Privacy Policy

- **Row Level Security (RLS)**: Every database table in `supabase/migrations/20261122_resumecraft.sql` isolates data per `auth.uid()`.
- **Zero Client-Side Keys**: API keys are processed strictly on server routes.
- **Client-Side Data Sanitization**: PII is anonymized prior to any external AI call.
- **Untrusted Input Isolation**: Job descriptions are sanitized and isolated from system prompt instructions to prevent prompt injection.
