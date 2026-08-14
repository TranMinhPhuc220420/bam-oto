import { Tag, Typography } from 'antd'
import type { ReactNode } from 'react'

interface PageHeroProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  extra?: ReactNode
}

export function PageHero({ eyebrow, title, description, actions, extra }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(240,253,250,0.95)_52%,rgba(236,254,255,0.92)_100%)] p-4 text-slate-900 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] sm:rounded-[28px] sm:p-5 lg:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_0,transparent_38%),radial-gradient(circle_at_bottom_right,rgba(8,145,178,0.08),transparent_0,transparent_28%)]" />

      <div className="relative flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-2 sm:space-y-2.5">
            {eyebrow ? (
              <Tag className="m-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-700">
                {eyebrow}
              </Tag>
            ) : null}

            <Typography.Title
              level={1}
              className="!mb-0 !text-[1.75rem] !font-semibold !leading-tight !text-slate-900 sm:!text-3xl md:!text-[2rem]"
            >
              {title}
            </Typography.Title>

            <Typography.Paragraph className="!mb-0 max-w-2xl !text-sm !leading-6 !text-slate-600 sm:!text-base md:!text-[17px]">
              {description}
            </Typography.Paragraph>
          </div>

          {actions ? (
            <div className="mobile-action-group flex w-full flex-wrap items-center gap-2.5 lg:w-auto lg:pl-4">
              {actions}
            </div>
          ) : null}
        </div>

        {extra ? <div className="flex flex-wrap gap-2">{extra}</div> : null}
      </div>
    </section>
  )
}
