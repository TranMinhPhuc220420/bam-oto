import { Card, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

const publicDomain = import.meta.env.VITE_PUBLIC_DOMAIN ?? 'bam.plt.pro.vn'

interface AuthPageShellProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthPageShell({ title, subtitle, children }: AuthPageShellProps) {
  const { t } = useTranslation()

  const highlights = [
    {
      title: t('auth.highlights.secureTitle'),
      detail: t('auth.highlights.secureDetail'),
    },
    {
      title: t('auth.highlights.roleTitle'),
      detail: t('auth.highlights.roleDetail'),
    },
    {
      title: t('auth.highlights.profileTitle'),
      detail: t('auth.highlights.profileDetail'),
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#14b8a64d,transparent_30%),radial-gradient(circle_at_bottom_right,#0f766e55,transparent_28%),linear-gradient(135deg,#020617,#0f172a_45%,#0b3b4f)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:px-10">
        <section className="max-w-2xl space-y-6 lg:flex-1">
          <div className="space-y-3">
            <Tag className="m-0 rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-100">
              {t('auth.heroBadge')}
            </Tag>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal-300">
              {publicDomain}
            </p>
          </div>

          <Typography.Title level={1} className="!mb-0 !text-4xl !font-semibold !text-white md:!text-5xl">
            {t('auth.heroTitle')}
          </Typography.Title>

          <Typography.Paragraph className="!mb-0 max-w-2xl !text-lg !text-slate-300">
            {subtitle}
          </Typography.Paragraph>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur"
              >
                <p className="mb-1 text-sm font-semibold text-white">{item.title}</p>
                <p className="mb-0 text-sm text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="w-full max-w-xl rounded-[32px] border-0 bg-white/95 shadow-[0_28px_80px_-30px_rgba(14,116,144,0.55)]">
          <div className="mb-6 space-y-2">
            <Typography.Title level={2} className="!mb-0 !text-3xl !font-semibold !text-slate-900">
              {title}
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-base !text-slate-600">
              {subtitle}
            </Typography.Paragraph>
          </div>

          {children}
        </Card>
      </div>
    </div>
  )
}
