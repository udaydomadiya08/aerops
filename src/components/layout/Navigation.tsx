import React from 'react'
import {
  Layers,
  LayoutDashboard,
  Users,
  AlertTriangle,
  Factory,
  SlidersHorizontal,
  Lock,
} from 'lucide-react'

export type TabId =
  | 'foundation'
  | 'dashboard'
  | 'suppliers'
  | 'shortages'
  | 'production'
  | 'simulation'

interface NavigationProps {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    {
      id: 'foundation' as TabId,
      label: 'Phase 1: Foundation & Data Architecture',
      icon: <Layers className="h-4 w-4" />,
      phase: 1,
    },
    {
      id: 'dashboard' as TabId,
      label: 'Executive Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      phase: 2,
    },
    {
      id: 'suppliers' as TabId,
      label: 'Supplier Matrix',
      icon: <Users className="h-4 w-4" />,
      phase: 2,
    },
    {
      id: 'shortages' as TabId,
      label: 'Material Shortages',
      icon: <AlertTriangle className="h-4 w-4" />,
      phase: 2,
    },
    {
      id: 'production' as TabId,
      label: 'Production Feasibility',
      icon: <Factory className="h-4 w-4" />,
      phase: 2,
    },
    {
      id: 'simulation' as TabId,
      label: 'What-If Simulator',
      icon: <SlidersHorizontal className="h-4 w-4" />,
      phase: 2,
    },
  ]

  return (
    <nav className="border-b border-slate-800 bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const isPhase2 = tab.phase === 2

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
                {isPhase2 && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    <Lock className="h-2.5 w-2.5" /> Phase 2
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
