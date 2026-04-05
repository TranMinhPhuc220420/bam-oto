import { Typography, Grid } from 'antd'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export function SectionCard({ title, description, actions, className, children }: SectionCardProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  return (
    <section
      className={[
        `overflow-hidden border border-slate-200/80 bg-white/90 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur ${isMobile ? 'rounded-[0px]' : 'rounded-[24px]'}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {title || description || actions ? (
        <div className={`flex flex-col gap-3.5 border-b border-slate-200/70 lg:flex-row lg:items-center lg:justify-between lg:gap-5 ${isMobile ? 'px-2 py-2' : 'px-4 py-3.5'}`}>
          {!isMobile && (
            <>
              <div className="min-w-0 space-y-1">
                {title ? (
                  <Typography.Title level={4} className="mobile-clamp-1 !mb-0 !text-slate-900">
                    {title}
                  </Typography.Title>
                ) : null}
                {description ? <p className="mb-0 max-w-3xl text-sm text-slate-500">{description}</p> : null}
              </div>
            </>
          )}
          {actions ? (
            <div className="mobile-action-group flex w-full flex-wrap items-center gap-2.5 lg:w-auto lg:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="p-0">{children}</div>
    </section>
  )
}
