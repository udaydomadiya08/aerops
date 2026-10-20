import React from 'react'
import { Badge, type BadgeVariant } from './Badge'

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  subtext?: string
  badgeText?: string
  badgeVariant?: BadgeVariant
  icon?: React.ReactNode
  status?: 'healthy' | 'watch' | 'critical' | 'neutral'
  infoNote?: string
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  subtext,
  badgeText,
  badgeVariant = 'neutral',
  icon,
  status = 'neutral',
  infoNote,
}) => {
  const borderStatusClass = {
    healthy: 'border-slate-800 hover:border-emerald-500/40',
    watch: 'border-slate-800 hover:border-amber-500/40',
    critical: 'border-slate-800 hover:border-rose-500/40',
    neutral: 'border-slate-800 hover:border-slate-700',
  }[status]

  return (
    <div
      role="region"
      aria-label={`${title} Metric Card`}
      className={`relative flex flex-col justify-between rounded-xl bg-slate-900/90 p-5 border ${borderStatusClass} transition-all duration-200 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        {icon && (
          <div aria-hidden="true" className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold tracking-tight text-white font-mono">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
        {subtext && <span className="text-slate-400 truncate">{subtext}</span>}
        {badgeText && (
          <Badge variant={badgeVariant} size="sm">
            {badgeText}
          </Badge>
        )}
      </div>

      {infoNote && (
        <div className="mt-2 text-[10px] text-slate-500 italic">
          {infoNote}
        </div>
      )}
    </div>
  )
}
