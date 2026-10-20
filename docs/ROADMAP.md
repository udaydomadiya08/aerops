# AeroOps Control Tower — Delivery Roadmap

## 1. Project Roadmap Overview

AeroOps Control Tower follows a disciplined four-phase delivery framework designed to guarantee technical stability, business validity, and professional presentation.

```
┌─────────────────┐     ┌───────────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│ Phase 1:        │ ──> │ Phase 2:              │ ──> │ Phase 3:            │ ──> │ Phase 4:             │
│ Foundation      │     │ Functional App        │     │ Verify & Polish     │     │ Deploy & Publish     │
│ [CURRENT PHASE] │     │ [Awaiting Approval]   │     │ [Pending Phase 2]   │     │ [Pending Phase 3]    │
└─────────────────┘     └───────────────────────┘     └─────────────────────┘     └──────────────────────┘
```

---

## 2. Phase Breakdown

### Phase 1: Foundation (CURRENT ACTIVE PHASE)
- **Objective:** Establish formal specifications, data contracts, deterministic calculation utilities, coherent synthetic fixtures, and a minimal verifiable application shell.
- **Key Milestones:**
  - [x] Workspace inspection (completed: empty directory verified).
  - [x] Project scaffolding with Vite, React 19, TypeScript strict mode, Tailwind CSS v4, Lucide icons, Vitest, and Recharts.
  - [x] Formal documentation suite: `README.md`, `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `BUSINESS_RULES.md`, `DATA_DICTIONARY.md`, `ROADMAP.md`.
  - [x] Strict TypeScript domain definitions (`src/types/`).
  - [x] Coherent aerospace synthetic dataset (`src/data/`).
  - [x] Pure deterministic calculation utilities (`src/utils/calculations.ts`).
  - [x] Unit test suites with edge-case test coverage (`src/utils/__tests__/calculations.test.ts`).
  - [x] Minimal, clean application shell confirming design system foundations (`src/App.tsx`).
  - [x] Verification: zero type errors (`npm run typecheck`), all unit tests passing (`npm test`), production build succeeding (`npm run build`).
- **Gate:** STOP and present Phase 1 deliverables for explicit user approval before any Phase 2 implementation.

---

### Phase 2: Functional Application (COMPLETED)
- **Objective:** Implement interactive decision-support views, visualizations, what-if simulator, and explainable action advisor.
- **Key Milestones:**
  - [x] Executive Operations Dashboard with live KPI cards and trend indicators (Fleet OTD %, Shortage Count, At-Risk Orders, Quality Defect Rate, Net Budget Variance).
  - [x] Interactive Charts using Recharts (Fleet OTD 6-week rolling trendline, AS9100 defect category distribution, commodity budget vs actual spend).
  - [x] Supplier Performance & Risk Matrix with search, tier/risk filters, sortable columns, and transparent heuristic formula breakdown modal.
  - [x] Material Shortage Analyzer with Gross-to-Net explosion, usable free stock calculation, post-need receipt exclusion, and financial shortage exposure in USD.
  - [x] Production Order Feasibility Monitor with batch progress bars, explainable diagnostic tags, and full Bill of Materials (BOM) component drill-downs.
  - [x] Interactive What-If Scenario Simulator with sliders (lead-time delay, scrap surge), toggles (expedited air freight, dual sourcing buffer), real-time delta KPIs, and Reset-to-Baseline action.
  - [x] Explainable Operational Action Advisor with root-cause identification, potential impact estimation, practical recommended actions, and acknowledgement controls.
  - [x] Global cut-off date indicator, navigation badges, and functional Reset View action.
  - [x] Unit test suite expanded to 25 tests covering scenario simulations and recommendation generation.
- **Gate:** STOP and present Phase 2 deliverables for explicit user approval before proceeding to Phase 3.

---

### Phase 3: Verification & Polish (Planned)
- **Objective:** Comprehensive testing, responsiveness, accessibility, and visual refinement.
- **Key Milestones:**
  - Edge-case testing: zero denominator cases, extreme lead times, empty datasets, large batch simulation.
  - Responsive audit: Mobile (375px), Tablet (768px), Desktop (1440px) fluid layouts.
  - Accessibility audit: WCAG 2.1 AA compliance, keyboard navigation, high-contrast badges, ARIA labels.
  - Micro-interactions, clean table pagination, smooth tab transitions, loading states.
- **Prerequisite:** Completion and functional signoff on Phase 2.

---

### Phase 4: GitHub & Deployment (Planned)
- **Objective:** Production release, deployment configuration, and portfolio presentation artifacts.
- **Key Milestones:**
  - Professional repository documentation with architecture diagrams and demo walkthrough.
  - Vercel / Netlify / GitHub Pages deployment configuration.
  - Production build verification and performance audit.
  - High-resolution application screenshots and portfolio summary tailored for TASL interview evaluation.
- **Prerequisite:** Completion of Phase 3 verification.

---

## 3. Phase 1 Acceptance Checklist

| Item | Requirement | Verification Method | Status |
| :--- | :--- | :--- | :---: |
| 1 | Existing workspace inspected | List directory & check contents | Pass |
| 2 | Documentation suite complete | 6 Markdown files in `docs/` and root | Pass |
| 3 | Domain model typed | `src/types/domain.ts` with strict types | Pass |
| 4 | Synthetic fixtures consistent | 6 JSON fixtures with verified foreign keys | Pass |
| 5 | Pure calculation functions | `src/utils/calculations.ts` | Pass |
| 6 | Unit tests implemented | Vitest test suite covering edge cases | Pass |
| 7 | Application shell runnable | Clean React shell reflecting design system | Pass |
| 8 | Strict type check passing | `npm run typecheck` exits with code 0 | Pass |
| 9 | Unit tests passing | `npm test` exits with code 0 | Pass |
| 10 | Production build clean | `npm run build` exits with code 0 | Pass |
