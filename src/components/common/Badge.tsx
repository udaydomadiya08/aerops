import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
  icon?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  const variantClasses = {
    success: 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/80',
    warning: 'bg-amber-950/70 text-amber-400 border border-amber-800/80',
    danger: 'bg-rose-950/70 text-rose-400 border border-rose-800/80',
    info: 'bg-blue-950/70 text-blue-400 border border-blue-800/80',
    neutral: 'bg-slate-800/80 text-slate-300 border border-slate-700',
    outline: 'bg-transparent text-slate-400 border border-slate-700',
  }[variant]

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md tracking-wide ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
