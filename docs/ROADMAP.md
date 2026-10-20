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

### Phase 2: Functional Application (Upcoming)
- **Objective:** Implement interactive decision-support views, visualizations, what-if simulator, and explainable action advisor.
- **Key Milestones:**
  - Executive KPI Cards with trend indicators (Fleet OTD %, Shortage Count, At-Risk Orders, Defect Rate, Budget Variance).
  - Supplier Performance & Risk Matrix with filters (by Tier, Status, Lead Time) and formula explanations.
  - Material Shortage Analyzer with Gross-to-Net explosion and PO receipt timeline checking.
  - Production Order Feasibility Tracker with BOM drill-down and explainable risk tags.
  - Interactive What-If Scenario Simulator with real-time recalculation of supplier delays and scrap surges.
  - Explainable Action Advisor proposing prioritized mitigations linked to specific bottlenecks.
  - Global filters, search bar, active cut-off date selector, and data reset controls.
- **Prerequisite:** Explicit user signoff on Phase 1.

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
