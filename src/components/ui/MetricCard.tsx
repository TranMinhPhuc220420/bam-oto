import { Typography } from 'antd'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  onClick?: () => void
}

export function MetricCard({ label, value, hint, icon, onClick }: MetricCardProps) {
  const className = [
    'w-full rounded-[20px] border border-slate-200/80 bg-white p-3.5 text-left shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)] sm:rounded-[22px] sm:p-5',
    onClick
      ? 'cursor-pointer transition hover:border-teal-200 hover:shadow-[0_18px_40px_-28px_rgba(15,118,110,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography.Text className="mobile-clamp-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-[11px] sm:tracking-[0.24em]">
            {label}
          </Typography.Text>
          <div className="money-amount mt-1.5 text-[1.35rem] font-semibold leading-7 text-slate-900 sm:text-[1.75rem] sm:leading-8">
            {value}
          </div>
        </div>

        {icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-sm text-teal-700 sm:h-10 sm:w-10 sm:text-base">
            {icon}
          </div>
        ) : null}
      </div>

      {hint ? <p className="mobile-clamp-2 mb-0 text-sm leading-5 text-slate-500">{hint}</p> : null}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}
