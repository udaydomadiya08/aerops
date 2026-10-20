# AeroOps Control Tower — Business Logic & Calculation Rules

## 1. Overview & Mathematical Grounding

All operational metrics in AeroOps Control Tower are governed by deterministic formulas. Every metric defines its numerator, denominator, eligibility filter, zero-condition behavior, and aerospace operational interpretation.

---

## 2. Metric Specifications

### 2.1 Supplier On-Time Delivery Rate (OTD %)

#### Operational Context
In aerospace supply chains, On-Time Delivery (OTD) measures supplier schedule adherence against contracted contractual delivery dates. A delivery that arrives early or on the agreed date is deemed on-time; a delivery arriving even 1 day late disrupts assembly line kitting.

#### Mathematical Definition
$$\text{OTD (\%)} = \frac{\text{Eligible On-Time Orders Delivered}}{\text{Total Eligible Due Orders}} \times 100$$

#### Eligibility & Rules
- **Denominator ($\text{Total Eligible Due Orders}$):** Count of Purchase Orders where:
  - $\text{Expected Delivery Date} \le \text{Current Cut-off Date}$, OR
  - $\text{Status} \in \{\text{'delivered'}, \text{'delayed'}\}$.
- **Orders Not Yet Due:** Orders where $\text{Expected Delivery Date} > \text{Current Cut-off Date}$ AND status is $\text{'pending'}$ or $\text{'in\_transit'}$ are **excluded** from the denominator.
- **Numerator ($\text{Eligible On-Time Orders}$):** Count of eligible due orders where:
  - $\text{Actual Delivery Date} \le \text{Expected Delivery Date}$.
- **Zero Denominator Rule:** If $\text{Total Eligible Due Orders} = 0$, return $\text{OTD} = 100\%$ if no orders were late, or indicate `"No Due Orders"` with flag `isEligible: false`. Default numerical output is `100.0` or `null` based on display context.

---

### 2.2 Quality Defect Rate (%)

#### Operational Context
Aerospace receiving inspection verifies compliance with material certifications and dimensional tolerances (AS9100). Defect rate is evaluated at the physical unit level rather than order level to capture true scrap and rework exposure.

#### Mathematical Definition
$$\text{Defect Rate (\%)} = \frac{\sum \text{Rejected Units}}{\sum \text{Inspected Units}} \times 100$$

#### Eligibility & Rules
- **Denominator ($\text{Inspected Units}$):** Total units physically inspected across quality receiving logs.
- **Numerator ($\text{Rejected Units}$):** Units marked as scrap, rework, or rejected during receiving or stage inspection.
- **Zero Denominator Rule:** If $\text{Inspected Units} = 0$, return `0.0%` with flag `hasInspections: false`.
- **Target Aerospace Thresholds:**
  - $\le 1.0\%$: Compliant (Green)
  - $> 1.0\%$ and $\le 3.0\%$: Elevated Warning (Amber)
  - $> 3.0\%$: Severe Quality Escapement (Red)

---

### 2.3 Inventory Availability & Net Shortage

#### Operational Context
Gross warehouse inventory is often deceptive. If an assembly bay has already reserved 40 titanium bolts for Work Order #101, those 40 bolts cannot be used for Work Order #102. Furthermore, a purchase order arriving on June 30th cannot satisfy a production need date of June 15th.

#### Mathematical Definitions

**1. Net Free On-Hand Inventory:**
$$\text{Free On-Hand} = \max(0, \text{On-Hand Quantity} - \text{Allocated Quantity})$$

**2. Valid Scheduled Receipts:**
$$\text{Valid Receipts} = \sum_{\text{PO} \in \text{POs}} \text{Ordered Quantity} \quad \text{where} \quad \text{Expected Delivery Date} \le \text{Required Date} \land \text{Status} \ne \text{'cancelled'}$$

*(Crucial Aerospace Rule: Scheduled receipts arriving after the requirement date are strictly ignored for immediate shortage mitigation.)*

**3. Net Component Shortage:**
$$\text{Net Shortage} = \max(0, \text{Gross Requirement} - (\text{Free On-Hand} + \text{Valid Receipts}))$$

- **Safety Stock Warning:** If $\text{Free On-Hand} < \text{Safety Stock}$, a replenishment alert is triggered even if $\text{Net Shortage} = 0$.

---

### 2.4 Production Order Risk & Feasibility

#### Operational Context
Production work orders require 100% of Bill-of-Materials (BOM) components to complete assembly. An order is at risk if its required materials are unavailable by the planned assembly date, or if shop-floor progress is falling behind schedule.

#### Evaluation Logic & Risk Severity Classification
For each production order $P$:
1. **Material Readiness Check:**
   - For every required component $C_i$ in $P$'s Bill of Materials:
   - Calculate available balance at $P$'s planned start date.
   - If any component has $\text{Net Shortage} > 0$, flag order with `Risk Type: Material Shortage`.
2. **Schedule Progress Check:**
   - If $\text{Current Date} > \text{Planned Start Date}$ AND $\text{Completed Quantity} = 0$, flag order with `Risk Type: Schedule Delay (Unstarted)`.
   - If completion rate per elapsed day suggests target date will be missed, flag order with `Risk Type: Pacing Risk`.
3. **Severity Categorization:**
   - **Critical Line-Stop Risk (Red):** Material shortage exists AND Planned Start Date is $\le 7\text{ days}$ away.
   - **Moderate Schedule Risk (Amber):** Planned start date is $> 7\text{ days}$ away with pending shortages, or progress is lagging by $\le 15\%$.
   - **Healthy / On Track (Green):** 100% material available or covered by valid receipts, and schedule is on track.

*Ethical Transparency Rule: System labels orders as "Potential Risk" or "At-Risk", explaining the underlying cause, rather than asserting certainty of downstream delivery failure.*

---

### 2.5 Budget Variance

#### Operational Context
Tracks procurement and operations capital/operational expenditure against monthly or quarterly budget allocations.

#### Mathematical Definitions
$$\text{Variance (\$) } = \text{Actual Expenditure} - \text{Budget Amount}$$

$$\text{Variance (\%)} = \begin{cases} 
\frac{\text{Actual Expenditure} - \text{Budget Amount}}{\text{Budget Amount}} \times 100 & \text{if } \text{Budget Amount} > 0 \\
0 & \text{if } \text{Budget Amount} = 0 \land \text{Actual} = 0 \\
100.0 & \text{if } \text{Budget Amount} = 0 \land \text{Actual} > 0 
\end{cases}$$

#### Interpretation Convention
- **$\text{Variance} > 0$:** Over budget (Unfavorable / Red if $> +5\%$).
- **$\text{Variance} = 0$:** Exactly on budget.
- **$\text{Variance} < 0$:** Under budget (Favorable / Green).

---

### 2.6 Supplier Composite Risk Score (Heuristic)

#### Operational Context
To assist procurement engineers in prioritizing supplier reviews, a composite risk index from $0$ (lowest risk) to $100$ (highest risk) is calculated. This score is completely transparent and explainable.

#### Weighted Formula
$$\text{Risk Score} = (w_{\text{OTD}} \times S_{\text{OTD}}) + (w_{\text{Defect}} \times S_{\text{Defect}}) + (w_{\text{LeadTime}} \times S_{\text{LeadTime}})$$

Where weights $w$ sum to $1.0$:
- $w_{\text{OTD}} = 0.45$ (Schedule compliance is paramount in aerostructures)
- $w_{\text{Defect}} = 0.35$ (Quality escapes carry severe scrap/rework costs)
- $w_{\text{LeadTime}} = 0.20$ (Excessive or volatile lead times increase inventory holding needs)

#### Sub-Score Normalization:
- $S_{\text{OTD}} = \max(0, \min(100, (100 - \text{OTD \%})))$
- $S_{\text{Defect}} = \min(100, \text{Defect Rate \%} \times 20)$  *(e.g., a 5% defect rate maps to 100 risk)*
- $S_{\text{LeadTime}} = \min(100, \max(0, (\text{Actual Lead Time Days} - \text{Contracted Lead Time Days}) \times 5))$

#### Classification Thresholds:
- **Low Risk:** Score $< 25$
- **Watch / Moderate Risk:** $25 \le \text{Score} < 55$
- **Critical Risk:** $\text{Score} \ge 55$

*Transparency Notice: The composite score is an operational heuristic for prioritization, not a predictive machine-learning algorithm.*
