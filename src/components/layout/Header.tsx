import React from 'react'
import { Plane, ShieldCheck, Calendar, RefreshCw } from 'lucide-react'
import { Badge } from '../common/Badge'

interface HeaderProps {
  cutoffDate: string
  onResetData?: () => void
}

export const Header: React.FC<HeaderProps> = ({ cutoffDate, onResetData }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Operational Branding */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Plane className="h-5 w-5 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  AeroOps Control Tower
                </h1>
                <Badge variant="info" size="sm">
                  Phase 2 Functional
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Aerospace Manufacturing Operations Decision Support &bull; TASL Management Trainee Project
              </p>
            </div>
          </div>

          {/* Operational Status & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-slate-400">Cut-off Date:</span>
              <span className="font-mono font-semibold text-slate-100">{cutoffDate}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="font-medium">Operational Decision Engine Active</span>
            </div>

            {onResetData && (
              <button
                onClick={onResetData}
                title="Reset all filters, simulation parameters, and data state to baseline"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
              >
                <RefreshCw className="h-3 w-3 text-slate-400" />
                <span>Reset View</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
