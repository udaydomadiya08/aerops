# AeroOps Control Tower — Product Specification

## 1. Document Control
- **Document Version:** 1.0.0
- **Status:** Approved for Phase 1
- **Focus:** Manufacturing Operations Decision-Support (Aerospace & Aerostructures)
- **Target Persona:** Management Trainee (Operations/Supply Chain) at Tata Advanced Systems Limited (TASL)

---

## 2. Problem Statement & Context

Aerospace manufacturing programs (e.g., airframe sub-assemblies, composite panels, avionics bays, radar enclosures) operate under stringent quality constraints (AS9100 / ISO 9001), long component procurement lead times (often 6 to 24 weeks for aerospace-grade alloys and qualified fasteners), and complex multi-level Bills of Materials (BOM).

In this environment, operations leaders frequently face:
1. **Opaque Supplier Health:** Delayed warning when a Tier-1 or Tier-2 supplier's rolling On-Time Delivery (OTD) drops, leading to line-stopping surprises.
2. **Disconnected Inventory Visibility:** Gross warehouse stock misrepresents true availability when units are already committed to earlier production work orders.
3. **Cascading Assembly Delays:** A single missing rivet alloy or titanium pin can halt a ₹10 Cr fighter assembly jig or commercial aerostructure line.
4. **Quality Scrap Shocks:** Elevated incoming receiving rejection rates that abruptly wipe out safety stock.
5. **Slow Manual Triage:** Operations teams spending hours reconciling Excel sheets across ERP, warehouse receipts, and shop-floor scheduling instead of taking proactive mitigation steps.

---

## 3. Core Operational Questions Answered

AeroOps Control Tower consolidates operational signals into a single pane of glass to answer five fundamental questions:

| # | Operational Question | System Decision-Support Mechanism |
| :- | :--- | :--- |
| **Q1** | **Are suppliers delivering reliably?** | Evaluates supplier-level OTD, average lead-time variance, defect rates, and classified risk status (Low / Watch / Critical). |
| **Q2** | **Which materials are in shortage?** | Calculates net shortage: `max(0, Gross Req - (Available On-Hand + Valid Scheduled POs))`, excluding POs arriving after order requirement dates. |
| **Q3** | **Which production orders may be delayed?** | Analyzes BOM component readiness against required completion dates and flags orders with transparent diagnostic tags. |
| **Q4** | **Where are quality & budget risks emerging?** | Monitors incoming inspection defect rates and departmental procurement budget variances against thresholds. |
| **Q5** | **What practical actions should be considered next?** | Generates prioritized, explainable mitigation recommendations (e.g., dual-source buffer expediting, order rescheduling, supplier audits). |

---

## 4. User Personas

### 4.1 Plant Operations Manager (Primary)
- **Goals:** Maintain final assembly line (FAL) takt time, prevent jig idle time, hit monthly delivery commitments.
- **Pain Points:** Disparate data sources, lack of consolidated risk overview, late escalation of component bottlenecks.
- **Usage:** Uses executive KPI summary, high-risk production order queue, and recommended actions daily.

### 4.2 Lead Procurement & Supplier Quality Engineer
- **Goals:** Manage supplier delivery schedules, resolve supplier quality escapes, enforce vendor SLAs.
- **Pain Points:** Inability to pinpoint chronic late deliverers vs. one-off delays; unclear link between late POs and critical production orders.
- **Usage:** Uses Supplier Performance Matrix, PO tracking filters, and inspection defect summaries.

### 4.3 Production Planning Specialist
- **Goals:** Schedule shop floor work orders, release kits to assembly bays, balance work-in-progress (WIP).
- **Pain Points:** Releasing work orders only to discover missing allocated hardware mid-assembly.
- **Usage:** Uses Material Shortage Analyzer and Production Order Feasibility view before releasing kits.

---

## 5. Functional Scope & Modules

### 5.1 Executive Operations Dashboard (Phase 2)
- High-impact operational KPI cards:
  - Fleet-wide Supplier On-Time Delivery (OTD %)
  - Critical Material Shortage Count (Active Shortages)
  - At-Risk Production Orders (Potential Delays)
  - Receiving Inspection Defect Rate (%)
  - Net Procurement Budget Variance ($ / %)
- Trend visualizations for weekly delivery compliance and defect trends.

### 5.2 Supplier Performance & Risk Matrix (Phase 2)
- Table view of all Tier-1 and Tier-2 component suppliers.
- Detailed metrics: Orders Placed, Orders Due, Delivered On Time, Units Received, Rejected Units, Defect Rate %, Average Lead Time, and Heuristic Risk Category.
- Transparent formula popover detailing how each metric is calculated.

### 5.3 Inventory & Shortage Engine (Phase 2)
- Component master list with on-hand, allocated, and free uncommitted inventory.
- Material reorder threshold indicators and safety stock depletion alerts.
- Scheduled receipts filtering: POs arriving *after* need date are highlighted and excluded from immediate supply calculations.

### 5.4 Production Order Risk Monitor (Phase 2)
- Assembly order tracker displaying planned quantity, start date, required completion date, and completion status.
- Bill of Materials (BOM) drilldown highlighting which specific component is causing a bottleneck.
- Severity scoring and status badges (Healthy, Moderate Risk, Critical Line-Stop Risk).

### 5.5 Interactive What-If Scenario Simulator (Phase 2)
- Interactive sliders / parameter toggles:
  - Supplier Lead Time Slippage (+5 to +20 days)
  - Receiving Scrap / Defect Surge (+2% to +10%)
  - Expedite Critical Purchase Orders (Rush delivery override)
- Real-time recalculation of downstream impacted production orders and projected budget variance.

### 5.6 Explainable Action Advisor (Phase 2)
- Contextual recommendations paired directly with the root-cause data.
- Structured format: Problem detected, Root cause entity, Recommended operational action, Estimated lead time or cost impact.
- Strict non-autonomous design: Advisory only; requires human approval.

---

## 6. Non-Goals (Out of Scope)

To maintain focus, architectural integrity, and lightweight reliability, the following are explicitly non-goals:
1. **No Live ERP/MES Direct Writeback:** The application does not write back transactions to SAP, Oracle, or MES systems; it operates as an analytical decision-support layer.
2. **No Proprietary Company Data:** Fictional synthetic aerospace components (e.g., Titanium Wing Spars, Carbon Composite Fairings, Inconel Fasteners) are used exclusively.
3. **No Unexplainable "Black-Box AI":** No ungrounded LLM chat bubbles or hallucinated figures. All metrics, risk scores, and recommendations are fully deterministic and mathematically verifiable.
4. **No Heavyweight Backend or Database:** Runs entirely client-side with typed data structures, ensuring instantaneous response times and zero cloud infrastructure costs.
5. **No Commercial Transaction Gateway:** No live purchase order creation or financial payments.
