# How ResumeCraft Tailoring Engine Works (Technical Architecture)

This document provides a transparent, in-depth explanation of how the ResumeCraft tailoring engine analyzes Job Descriptions (JDs), matches technical skills, and refines your resume content—even when **no external AI API key is configured in your `.env` file**.

---

## 1. Quick Answer: Why Does It Work Without an API Key?

ResumeCraft was designed with an **Adaptive Dual-Engine Architecture**:

1. **Engine A: Built-in Deterministic & Semantic Engine (Active by Default)**
   - Operates **100% locally in Node.js without requiring any API key, internet access, or external paid service**.
   - Uses NLP tokenization, technical dictionary matching, semantic intent analysis, and evidence-grounded template synthesis.
   - Guaranteed **sub-second speed**, **zero cost**, and **zero AI hallucinations**.

2. **Engine B: Google Gemini Cloud AI Engine (Optional Plug-in)**
   - Activates **only** if a valid `GEMINI_API_KEY` is detected in your `.env` or `.env.local` file.
   - If no key is set (or if the key is empty, invalid, or rate-limited), the system automatically and seamlessly falls back to **Engine A**.

Because your `.env` currently has no AI key, **Engine A is handling your JD analysis, skill matching, and resume tailoring locally on your server.**

---

## 2. Component-by-Component Walkthrough

### A. Job Description (JD) Analysis (`src/lib/ai/jdAnalyzer.ts`)

When you paste or upload a Job Description:

1. **Role Intent Extraction**:
   - The analyzer parses the text using keyword dictionaries and regex patterns to identify:
     - **Role Type**: Backend, Frontend, Full-Stack, Mobile, Data Engineering, DevOps, QA, etc.
     - **Core Responsibilities**: Key action sentences starting with verbs like *"architect"*, *"develop"*, *"design"*, *"manage"*.
     - **Qualifications**: Degrees, years of experience, and educational requirements.
2. **Skill Extraction & Alias Normalization**:
   - The engine scans the JD text against a technical vocabulary (Java, Spring Boot, React, Next.js, PostgreSQL, MongoDB, Talend, Docker, etc.).
   - It normalizes variations and aliases to standard canonical forms:
     - `JS` or `ES6` $\rightarrow$ `JavaScript`
     - `Postgres` $\rightarrow$ `PostgreSQL`
     - `Spring` $\rightarrow$ `Spring Boot`
     - `Tailwind` $\rightarrow$ `Tailwind CSS`
     - `MongoDB Atlas` $\rightarrow$ `MongoDB`
3. **Match Status Classification**:
   - Each required skill is cross-referenced with your verified profile:
     - **Available (Green)**: Exactly matches a skill or alias you have verified in your profile.
     - **Partial (Amber)**: Related technical proficiency in the same family.
     - **Missing (Red)**: Required by the JD but not present in your profile.

---

### B. Resume Content Refinement (`src/lib/ai/tailorEngine.ts`)

How does it rewrite your summary and project lines without an LLM?

1. **Dynamic Profile Summary Adaptation**:
   - The engine detects the primary focus of the JD:
     - **If Backend-heavy** (APIs, Spring Boot, Java, PostgreSQL, Microservices): It selects summary phrasing emphasizing scalable backend architectures, REST APIs, and database design.
     - **If Frontend-heavy** (React, Next.js, Tailwind, TypeScript, UI/UX): It selects summary phrasing emphasizing responsive component architecture and state management.
     - **If Data/ETL-heavy** (Talend, SQL, pipelines, migration): It highlights enterprise ETL pipelines, Oracle SQL optimization, and end-to-end data integrity.
     - **If Full-Stack**: It combines your React/Next.js frontend expertise with Spring Boot/MongoDB backend capabilities.

2. **Project Lines & Bullet Point Tailoring**:
   - **Relevance Sorting**: Projects with the highest keyword and technology overlap with the JD are sorted to the top.
   - **Contextual Description Selection**:
     - *Career Mock*: When applying for a backend role, the description emphasizes *backend REST APIs, Supabase RBAC authentication, and real-time streaming*. When applying for a frontend role, it emphasizes *responsive Next.js UI, voice simulation, and modern frontend interactions*.
     - *Rupee Tracker*: When applying for backend/data roles, it emphasizes *automated data collection pipelines with Bright Data and MongoDB persistence*.
   - **Bullet Phrasing Alignment**: Pre-verified action statements are selected to highlight the specific metrics and engineering challenges matching the target JD.

3. **Technical Skills Re-ordering**:
   - Within each skill category (Languages, Frontend, Backend, Databases, Tools), skills requested in the JD are dynamically moved to the beginning of the list to ensure immediate ATS visibility.

---

### C. Zero-Hallucination & Fact Grounding (`src/lib/verification/factChecker.ts`)

A major risk with generic AI tools (like ChatGPT) is that they often invent false experiences or claim technologies you have never used.

ResumeCraft prevents this through a **Strict Ground Truth Verification System**:

- Every project, experience, and bullet point is tagged with an immutable **`sourceFactId`** (e.g., `exp-cae-1`, `proj-cm-1`).
- Before any resume draft is exported or saved:
  1. The Fact Checker verifies that every bullet statement maps back to a genuine fact ID in your profile.
  2. Any technology not found in your profile's verified skills list is **automatically stripped**.
  3. If an AI or user attempts to claim an unverified skill, the engine rejects it and displays an audit warning.

---

### D. Privacy Sanitizer (`src/lib/ai/privacySanitizer.ts`)

If you decide to enable an external AI API key in the future:
- Your Personally Identifiable Information (PII)—including phone number, email address, physical location, and full name—is **redacted** before transmitting prompts to any external cloud provider.
- Contact details are rehydrated only on the local machine when compiling the final PDF or DOCX file.

---

## 3. Summary Comparison: Local Engine vs. Gemini AI

| Feature | Built-in Local Engine (Current) | Gemini Cloud AI (Optional) |
| :--- | :--- | :--- |
| **Requires API Key?** | **No** (0 keys required) | Yes (`GEMINI_API_KEY` in `.env.local`) |
| **Cost** | 100% Free | Depends on Gemini API tier (free tier available) |
| **Execution Location** | Local Node.js server | Google Cloud Gemini API |
| **Speed** | Instantaneous (< 50ms) | 1.5 – 3.0 seconds |
| **Hallucination Risk** | **0%** (Strict deterministic mapping) | Low (Guarded by Fact Checker) |
| **Offline Support** | Yes (Works completely offline) | No (Requires internet access) |
| **Summary Tailoring** | Semantic category switching | Open-ended generative phrasing |

---

## 4. How to Enable Gemini AI (Optional)

If you ever wish to test generative phrasing with Gemini 2.5 Flash:

1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Open or create `.env.local` in your project root:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
3. Restart the development server:
   ```bash
   pnpm dev -p 3000
   ```
4. The system will detect the key and switch `tailoringEngine` from `'heuristic-fallback'` to `'gemini-api'`. If the API key is ever removed or exhausted, the system automatically falls back to the local engine without crashing.
