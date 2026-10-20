# AeroOps Control Tower

> **Aerospace Manufacturing Operations Decision-Support System**  
> *Independent Portfolio Demonstration Project — Prepared for Tata Advanced Systems Limited (TASL) Management Trainee Operations Focus*

---

## 1. Executive Summary & Purpose

In complex aerospace defense and aerostructures manufacturing, production continuity depends on tight synchronization across suppliers, multi-tier bills of materials (BOM), precision inventory buffers, and rigorous aerospace quality standards (e.g., AS9100). When unexpected supplier delays, material defects, or tooling bottlenecks occur, operations managers need immediate visibility into downstream assembly risks and grounded decision support.

**AeroOps Control Tower** is a manufacturing operations decision-support web application designed to address five operational questions:

1. **Supplier Reliability:** Are Tier-1 and Tier-2 suppliers meeting On-Time In-Full (OTIF/OTD) delivery targets?
2. **Material Availability:** Which critical structural, avionics, or fastener components face imminent shortages?
3. **Production Order Feasibility:** Which aerostructure assembly orders are at risk of line stoppages due to material lead-time gaps?
4. **Quality & Cost Control:** Where are defect spikes and procurement budget variances exceeding tolerances?
5. **Actionable Recommendations:** What prioritized, practical operational actions (e.g., dual-sourcing expediting, buffer reallocation, line balancing) should management evaluate?

> **Notice:** AeroOps Control Tower is an independent technical demonstration and portfolio project. It uses purely fictional, synthetic aerospace manufacturing data. It contains no confidential information, does not claim access to proprietary TASL systems, and does not represent an official TASL product.

---

## 2. System Capabilities & Architecture Overview

The system is built on a modular, client-side, deterministic architecture designed for maximum reliability and maintainability:

- **Operational Health Dashboard:** Executive KPI cards (Fleet OTD, Shortage Count, At-Risk Production Orders, Inspection Defect Rate, Budget Variance).
- **Supplier Performance Matrix:** Granular evaluation of supplier lead-time compliance, defect rates, and risk scoring with transparent calculation formulas.
- **Inventory & Material Shortage Engine:** Multi-assembly allocation analysis with gross-to-net shortage calculation and scheduled receipt filtering.
- **Production Order Feasibility Tracker:** BOM explosion checking component availability against order requirement dates with explainable risk tagging.
- **What-If Scenario Simulator (Phase 2):** Client-side simulation of supplier lead-time slippage, scrap rate surges, and expedited purchase orders.
- **Audit & Governance Traceability:** Transparent, documented business rules without unexplainable heuristic black boxes.

---

## 3. Technology Stack

- **Core & Runtime:** React 19, TypeScript (Strict Mode enabled).
- **Build Tooling:** Vite 8.
- **Styling System:** Tailwind CSS v4 with an aerospace-grade navy/slate industrial design system.
- **Icons & Visuals:** Lucide React (`lucide-react`).
- **Data Visualizations:** Recharts.
- **Test Framework:** Vitest for deterministic unit testing of business calculations and safety rules.
- **Environment:** Lightweight, cross-platform (tested on Apple Silicon macOS). Zero paid external APIs or database servers required.

---

## 4. Four-Phase Delivery Plan

| Phase | Title | Scope & Status |
| :--- | :--- | :--- |
| **Phase 1** | **Foundation** | **COMPLETED.** Architecture, data dictionary, domain models, business logic calculations, unit tests, synthetic fixtures, and foundational application shell. |
| **Phase 2** | **Functional Application** | **COMPLETED.** Executive dashboard with KPI trendlines, supplier performance scorecard, material shortage gross-to-net analyzer, production order feasibility monitor, interactive what-if simulator, and explainable action advisor. |
| **Phase 3** | **Verification & Polish** | **COMPLETED.** 47-test validation suite, code splitting (entry bundle 39 kB), custom ErrorBoundary, WCAG 2.1 AA accessibility (landmarks, keyboard focus, ARIA tags, Escape listener), responsive layout audits, and error/empty states. |
| **Phase 4** | **Documentation & Deployment** | **AWAITING APPROVAL.** Production deployment, GitHub publishing configuration, automated preview scripts, and portfolio interview artifacts. |

---

## 5. Getting Started

### Prerequisites
- Node.js 20+ (tested on Node v22.22)
- npm 10+

### Installation & Execution
```bash
# Clone the repository and enter directory
cd aerrops

# Install dependencies
npm install

# Run type check (Strict TypeScript verification)
npm run typecheck

# Run unit tests
npm test

# Launch local development server
npm run dev

# Build production bundle
npm run build
```

---

## 6. Project Documentation Index

Detailed architectural and business specifications are available in the `docs/` directory:

- [`docs/PRODUCT_SPEC.md`](file:///Users/uday/Documents/uday_projects/aerrops/docs/PRODUCT_SPEC.md) — Problem statement, user personas, operational use cases, and non-goals.
- [`docs/ARCHITECTURE.md`](file:///Users/uday/Documents/uday_projects/aerrops/docs/ARCHITECTURE.md) — Technical architecture, state management, directory structure, and safety rules.
- [`docs/BUSINESS_RULES.md`](file:///Users/uday/Documents/uday_projects/aerrops/docs/BUSINESS_RULES.md) — Precise mathematical formulas, edge-case handlers, and metric definitions.
- [`docs/DATA_DICTIONARY.md`](file:///Users/uday/Documents/uday_projects/aerrops/docs/DATA_DICTIONARY.md) — Entity schemas, field constraints, relationships, and validation rules.
- [`docs/ROADMAP.md`](file:///Users/uday/Documents/uday_projects/aerrops/docs/ROADMAP.md) — Detailed milestones, dependencies, and Phase 1-4 acceptance criteria.
