import { Typography } from 'antd'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export function SectionCard({ title, description, actions, className, children }: SectionCardProps) {
  return (
    <section
      className={[
        'overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {title || description || actions ? (
        <div className="flex flex-col gap-4 border-b border-slate-200/70 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            {title ? (
              <Typography.Title level={4} className="!mb-0 !text-slate-900">
                {title}
              </Typography.Title>
            ) : null}
            {description ? <p className="mb-0 text-sm text-slate-500">{description}</p> : null}
          </div>

          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
      ) : null}

      <div className="p-0">{children}</div>
    </section>
  )
}
