import React from 'react'
import { Plane, ShieldCheck, Calendar, RefreshCw } from 'lucide-react'
import { Badge } from '../common/Badge'

interface HeaderProps {
  cutoffDate: string
  onResetData?: () => void
}

export const Header: React.FC<HeaderProps> = ({ cutoffDate, onResetData }) => {
  return (
    <header role="banner" className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Operational Branding */}
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner"
            >
              <Plane className="h-5 w-5 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  AeroOps Control Tower
                </h1>
                <Badge variant="info" size="sm">
                  Phase 2 Verified
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Aerospace Manufacturing Operations Decision Support &bull; TASL Management Trainee Project
              </p>
            </div>
          </div>

          {/* Operational Status & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              aria-label={`Current operational reporting cut-off date is ${cutoffDate}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300"
            >
              <Calendar className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
              <span className="text-slate-400">Cut-off Date:</span>
              <span className="font-mono font-semibold text-slate-100">{cutoffDate}</span>
            </div>

            <div
              role="status"
              aria-label="Operational decision engine active and validated"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-400"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-medium">Decision Engine Active</span>
            </div>

            {onResetData && (
              <button
                type="button"
                onClick={onResetData}
                aria-label="Reset application state, filters, and simulation parameters to baseline"
                title="Reset all filters, simulation parameters, and data state to baseline"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                <RefreshCw className="h-3 w-3 text-slate-400" aria-hidden="true" />
                <span>Reset View</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
