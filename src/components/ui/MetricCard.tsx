import { Typography } from 'antd'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
}

export function MetricCard({ label, value, hint, icon }: MetricCardProps) {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)] sm:p-5">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div>
          <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </Typography.Text>
          <div className="mt-1.5 text-[2rem] font-semibold leading-none text-slate-900">{value}</div>
        </div>

        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-base text-teal-700">
            {icon}
          </div>
        ) : null}
      </div>

      {hint ? <p className="mb-0 text-sm text-slate-500">{hint}</p> : null}
    </div>
  )
}
