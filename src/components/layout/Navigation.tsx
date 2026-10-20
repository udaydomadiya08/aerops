import React from 'react'
import {
  Layers,
  LayoutDashboard,
  Users,
  AlertTriangle,
  Factory,
  SlidersHorizontal,
  ShieldAlert,
} from 'lucide-react'

export type TabId =
  | 'dashboard'
  | 'suppliers'
  | 'shortages'
  | 'production'
  | 'simulation'
  | 'recommendations'
  | 'foundation'

interface NavigationProps {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  actionCount?: number
  shortageCount?: number
  atRiskOrderCount?: number
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  actionCount,
  shortageCount,
  atRiskOrderCount,
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabId,
      label: 'Executive Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'suppliers' as TabId,
      label: 'Supplier Matrix',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'shortages' as TabId,
      label: 'Material Shortages',
      icon: <AlertTriangle className="h-4 w-4" />,
      badge: shortageCount && shortageCount > 0 ? shortageCount : undefined,
      badgeVariant: 'danger',
    },
    {
      id: 'production' as TabId,
      label: 'Production Feasibility',
      icon: <Factory className="h-4 w-4" />,
      badge: atRiskOrderCount && atRiskOrderCount > 0 ? atRiskOrderCount : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'simulation' as TabId,
      label: 'What-If Simulator',
      icon: <SlidersHorizontal className="h-4 w-4" />,
    },
    {
      id: 'recommendations' as TabId,
      label: 'Action Advisor',
      icon: <ShieldAlert className="h-4 w-4" />,
      badge: actionCount,
      badgeVariant: 'info',
    },
    {
      id: 'foundation' as TabId,
      label: 'Architecture & Rules',
      icon: <Layers className="h-4 w-4" />,
    },
  ]

  return (
    <nav className="border-b border-slate-800 bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      tab.badgeVariant === 'danger'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : tab.badgeVariant === 'warning'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
