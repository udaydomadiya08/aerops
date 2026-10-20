import React from 'react'
import { Lock, ArrowRight, ShieldCheck, PlayCircle } from 'lucide-react'
import { Badge } from '../common/Badge'
import type { TabId } from '../layout/Navigation'

interface Phase2PreviewViewProps {
  tabId: TabId
  onGoToFoundation: () => void
}

export const Phase2PreviewView: React.FC<Phase2PreviewViewProps> = ({
  tabId,
  onGoToFoundation,
}) => {
  const content = {
    dashboard: {
      title: 'Executive Operations Dashboard',
      subtitle: 'Fleet-wide operational health overview, trendlines, and risk alerts.',
      features: [
        'Fleet On-Time Delivery compliance rate with 12-week rolling trendline (Recharts)',
        'Defect rate drill-down by AS9100 defect category (dimensional, metallurgical, surface finish)',
        'Critical material shortage counter with direct link to inventory replenishment',
        'Production order bottleneck queue highlighting orders with line-stop risks',
        'Procurement budget variance breakdown across commodity categories',
      ],
    },
    suppliers: {
      title: 'Supplier Performance & Risk Matrix',
      subtitle: 'Tier-1 & Tier-2 vendor scorecard with transparent heuristic risk rating.',
      features: [
        'Interactive table with column sorting (OTD %, Defect %, Average Lead Time, Risk Score)',
        'Heuristic Risk Score breakdown popover explaining OTD (45%), Defect (35%), and Lead-time (20%) weights',
        'Lead-time slippage indicators comparing actual lead times against contracted SLA baselines',
        'Filter by supplier tier (Tier 1 vs Tier 2) and administrative status (Active / Watch / Critical)',
      ],
    },
    shortages: {
      title: 'Material Shortage & Inventory Analyzer',
      subtitle: 'Component-level gross-to-net inventory shortage calculation engine.',
      features: [
        'Gross requirement aggregation across active aerostructure work orders',
        'Free unallocated stock calculator deducting committed WIP stock',
        'Scheduled PO receipts validator (strictly excluding POs arriving after requirement date)',
        'Safety stock depletion alerts and financial shortage exposure in USD',
        'One-click filter for critical shortages requiring immediate procurement expediting',
      ],
    },
    production: {
      title: 'Production Order Feasibility Monitor',
      subtitle: 'BOM component readiness and shop-floor assembly schedule feasibility.',
      features: [
        'Full Bill of Materials (BOM) explosion for each aerostructure assembly order',
        'Part-by-part readiness status (In Stock, Arriving in Time, Delayed/Shortage)',
        'Explainable diagnostic tags (Material Shortage, Schedule Pacing Lag, Past Due)',
        'Severity ranking: Healthy, Moderate Schedule Risk, Critical Line-Stop Risk',
        'Direct link between missing components and recommended supplier actions',
      ],
    },
    simulation: {
      title: 'Interactive What-If Scenario Simulator',
      subtitle: 'Client-side simulation of supply chain disruptions and mitigation decisions.',
      features: [
        'Supplier Lead-Time Delay Slider (+5 to +20 days slippage simulation)',
        'Incoming Scrap Surge Slider (+2% to +10% receiving inspection defect surge)',
        'Expedited Purchase Orders Toggle (Simulate rush air-freight arrival)',
        'Real-time recalculation of downstream impacted assembly lines and budget variance',
        'Scenario reset and side-by-side comparison against baseline operations',
      ],
    },
    foundation: {
      title: 'Foundation',
      subtitle: '',
      features: [],
    },
  }[tabId]

  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-8 max-w-4xl mx-auto my-8">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="warning" icon={<Lock className="h-3 w-3" />}>
          Phase 2 Deliverable
        </Badge>
        <span className="text-xs text-slate-400">Scheduled for implementation upon explicit Phase 1 signoff</span>
      </div>

      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
        {content.title}
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        {content.subtitle}
      </p>

      <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-5 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-blue-400" />
          Planned Capabilities for Phase 2:
        </h3>
        <ul className="space-y-2.5 text-xs text-slate-300">
          {content.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Underlying calculation engine and data models are already fully implemented & tested.</span>
        </div>

        <button
          onClick={onGoToFoundation}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm"
        >
          <span>View Phase 1 Foundation Status</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
