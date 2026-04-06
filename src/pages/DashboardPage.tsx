import {
  ArrowRightOutlined,
  BankOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  TeamOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Alert, Button, Empty, Grid, Progress, Skeleton, Tag } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { MetricCard } from '../components/ui/MetricCard'
import { PageHero } from '../components/ui/PageHero'
import { SectionCard } from '../components/ui/SectionCard'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'
import type { Booking, BookingStatus } from '../types/Booking'
import { formatCurrencyVnd, getCurrencyLocale } from '../utils/currency'

function toDate(value: unknown) {
  if (value instanceof Date) {
    return value
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate()
  }

  return null
}

function getBookingStatusColor(status: BookingStatus) {
  switch (status) {
    case 'confirmed':
      return 'processing'
    case 'in-progress':
      return 'success'
    case 'completed':
      return 'default'
    case 'canceled':
      return 'error'
    default:
      return 'warning'
  }
}

function getPercent(value: number, total: number) {
  if (!total) {
    return 0
  }

  return Math.round((value / total) * 100)
}

function formatDateTime(value: unknown, language?: string) {
  const date = toDate(value)

  if (!date) {
    return '—'
  }

  return new Intl.DateTimeFormat(getCurrencyLocale(language), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function UpcomingBookingCard({ booking, language, onOpen }: { booking: Booking; language?: string; onOpen: () => void }) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-3 px-3.5 py-3 text-left transition hover:bg-slate-50 sm:px-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="mb-0 text-sm font-semibold text-slate-900">{booking.bookingCode}</p>
            <Tag color={getBookingStatusColor(booking.status)} className="m-0 rounded-full">
              {t(`bookings.status.${booking.status}`)}
            </Tag>
          </div>
          <p className="mobile-clamp-1 mb-0 text-sm text-slate-600">
            {booking.customerSnapshot?.fullName || t('dashboard.upcoming.customerFallback')}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700">
          <ArrowRightOutlined />
          {t('common.actions.view')}
        </span>
      </div>

      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {t('dashboard.upcoming.pickup')}
          </p>
          <p className="mb-0 font-medium text-slate-900">{formatDateTime(booking.startDate, language)}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {t('dashboard.upcoming.return')}
          </p>
          <p className="mb-0 font-medium text-slate-900">{formatDateTime(booking.endDate, language)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="rounded-full bg-teal-50 px-2.5 py-1 font-medium text-teal-700">
          {booking.carSnapshot?.plateNumber || '—'}
        </span>
        <span className="mobile-clamp-1">
          {[booking.carSnapshot?.brand, booking.carSnapshot?.model].filter(Boolean).join(' ')}
        </span>
      </div>
    </button>
  )
}

function QuickActionCard({
  title,
  description,
  icon,
  toneClass,
  onClick,
}: {
  title: string
  description: string
  icon: ReactNode
  toneClass: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full w-full flex-col gap-3 rounded-[20px] border border-slate-200/80 bg-white px-3.5 py-3.5 text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-base ${toneClass}`}>
          {icon}
        </div>
        <ArrowRightOutlined className="text-slate-400" />
      </div>

      <div className="space-y-1.5">
        <p className="mb-0 text-sm font-semibold text-slate-900">{title}</p>
        <p className="mb-0 text-sm leading-5 text-slate-600">{description}</p>
      </div>
    </button>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const screens = Grid.useBreakpoint()
  const {
    totalBookings,
    draftBookings,
    confirmedBookings,
    activeRentals,
    completedBookings,
    paidBookings,
    collectionRate,
    availableCars,
    todayPickups,
    todayReturns,
    overdueCount,
    inServiceCars,
    customerCount,
    teamCount,
    totalCollected,
    outstandingBalance,
    pendingCollectionsCount,
    rentedCars,
    cleaningCars,
    repairCars,
    fleetTotal,
    utilizationRate,
    upcomingBookings,
    isAdmin,
    loading,
  } = useDashboardMetrics()

  const primaryMetrics = [
    {
      key: 'active',
      label: t('dashboard.metrics.activeRentals'),
      value: activeRentals,
      hint: t('dashboard.metrics.activeRentalsHint'),
      icon: <CalendarOutlined />,
    },
    {
      key: 'available',
      label: t('dashboard.metrics.availableCars'),
      value: availableCars,
      hint: t('dashboard.metrics.availableCarsHint'),
      icon: <CheckCircleOutlined />,
    },
    {
      key: 'pickups',
      label: t('dashboard.metrics.todayPickups'),
      value: todayPickups,
      hint: t('dashboard.metrics.todayPickupsHint'),
      icon: <ClockCircleOutlined />,
    },
    {
      key: 'returns',
      label: t('dashboard.metrics.todayReturns'),
      value: todayReturns,
      hint: t('dashboard.metrics.todayReturnsHint'),
      icon: <CarOutlined />,
    },
  ]

  const secondaryMetrics = isAdmin
    ? [
        {
          key: 'overdue',
          label: t('dashboard.metrics.overdueBookings'),
          value: overdueCount,
          hint: t('dashboard.metrics.overdueBookingsHint'),
          icon: <WarningOutlined />,
        },
        {
          key: 'service',
          label: t('dashboard.metrics.inService'),
          value: inServiceCars,
          hint: t('dashboard.metrics.inServiceHint'),
          icon: <ToolOutlined />,
        },
        {
          key: 'outstanding',
          label: t('dashboard.metrics.outstanding'),
          value: formatCurrencyVnd(outstandingBalance, i18n.resolvedLanguage),
          hint: t('dashboard.metrics.outstandingHint'),
          icon: <BankOutlined />,
        },
        {
          key: 'team',
          label: t('dashboard.metrics.teamMembers'),
          value: teamCount,
          hint: t('dashboard.metrics.teamMembersHint'),
          icon: <TeamOutlined />,
        },
      ]
    : [
        {
          key: 'overdue',
          label: t('dashboard.metrics.overdueBookings'),
          value: overdueCount,
          hint: t('dashboard.metrics.overdueBookingsHint'),
          icon: <WarningOutlined />,
        },
        {
          key: 'service',
          label: t('dashboard.metrics.inService'),
          value: inServiceCars,
          hint: t('dashboard.metrics.inServiceHint'),
          icon: <ToolOutlined />,
        },
        {
          key: 'customers',
          label: t('dashboard.metrics.customers'),
          value: customerCount,
          hint: t('dashboard.metrics.customersHint'),
          icon: <TeamOutlined />,
        },
      ]

  const quickActions = [
    {
      key: 'new-booking',
      title: t('dashboard.quickActions.newBooking.title'),
      description: t('dashboard.quickActions.newBooking.description'),
      icon: <PlusOutlined />,
      toneClass: 'bg-teal-50 text-teal-700',
      onClick: () => navigate('/bookings/new'),
    },
    {
      key: 'bookings',
      title: t('dashboard.quickActions.bookings.title'),
      description: t('dashboard.quickActions.bookings.description'),
      icon: <CalendarOutlined />,
      toneClass: 'bg-cyan-50 text-cyan-700',
      onClick: () => navigate('/bookings'),
    },
    {
      key: 'cars',
      title: t('dashboard.quickActions.cars.title'),
      description: t('dashboard.quickActions.cars.description'),
      icon: <CarOutlined />,
      toneClass: 'bg-emerald-50 text-emerald-700',
      onClick: () => navigate('/cars'),
    },
    ...(isAdmin
      ? [
          {
            key: 'finance',
            title: t('dashboard.quickActions.finance.title'),
            description: t('dashboard.quickActions.finance.description'),
            icon: <BankOutlined />,
            toneClass: 'bg-violet-50 text-violet-700',
            onClick: () => navigate('/finance'),
          },
        ]
      : []),
  ]

  const pipelineMetrics = [
    {
      key: 'draft',
      label: t('bookings.status.draft'),
      value: draftBookings,
      className: 'border-amber-100 bg-amber-50 text-amber-700',
    },
    {
      key: 'confirmed',
      label: t('bookings.status.confirmed'),
      value: confirmedBookings,
      className: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    },
    {
      key: 'active',
      label: t('bookings.status.in-progress'),
      value: activeRentals,
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
    {
      key: 'completed',
      label: t('bookings.status.completed'),
      value: completedBookings,
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton active paragraph={{ rows: 3 }} className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton.Button key={index} active block className="!h-[124px] !w-full !rounded-[22px]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHero
        eyebrow={t('dashboard.page.eyebrow')}
        title={t('dashboard.page.title')}
        description={t('dashboard.page.description')}
        actions={
          <>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/bookings/new')}
              size={screens.md ? 'large' : 'middle'}
              className="rounded-full px-5"
            >
              {t('bookings.page.create')}
            </Button>
            <Button
              icon={<CarOutlined />}
              onClick={() => navigate('/cars')}
              size={screens.md ? 'large' : 'middle'}
              className="rounded-full px-5"
            >
              {t('shell.menu.cars')}
            </Button>
            {isAdmin ? (
              <Button
                icon={<BankOutlined />}
                onClick={() => navigate('/finance')}
                size={screens.md ? 'large' : 'middle'}
                className="rounded-full px-5"
              >
                {t('shell.menu.finance')}
              </Button>
            ) : null}
          </>
        }
        extra={
          <>
            <Tag className="m-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-teal-700">
              {t('dashboard.page.autoSyncTag')}
            </Tag>
            <Tag className="m-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
              {t('dashboard.page.operationsTag', { count: activeRentals })}
            </Tag>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {primaryMetrics.map((metric) => (
          <MetricCard key={metric.key} label={metric.label} value={metric.value} hint={metric.hint} icon={metric.icon} />
        ))}
      </div>

      <div className={`grid gap-4 ${secondaryMetrics.length === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
        {secondaryMetrics.map((metric) => (
          <MetricCard key={metric.key} label={metric.label} value={metric.value} hint={metric.hint} icon={metric.icon} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title={t('dashboard.sections.quickActionsTitle')}
          description={t('dashboard.sections.quickActionsDescription')}
        >
          <div className="grid gap-3 p-3.5 sm:grid-cols-2 sm:p-4">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.key}
                title={action.title}
                description={action.description}
                icon={action.icon}
                toneClass={action.toneClass}
                onClick={action.onClick}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={t('dashboard.sections.pipelineTitle')}
          description={t('dashboard.sections.pipelineDescription')}
        >
          <div className="grid gap-3 p-3.5 sm:grid-cols-2 sm:p-4">
            {pipelineMetrics.map((metric) => (
              <div key={metric.key} className={`rounded-[18px] border px-3.5 py-3 ${metric.className}`}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80">{metric.label}</p>
                <p className="mb-0 text-2xl font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200/70 px-3.5 py-3.5 sm:px-4 sm:py-4">
            <div className="rounded-[20px] bg-slate-50 px-3.5 py-3.5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="mb-0 text-sm font-semibold text-slate-900">{t('dashboard.pipeline.collectionRate')}</p>
                <span className="text-sm font-semibold text-teal-700">{collectionRate}%</span>
              </div>
              <Progress percent={collectionRate} showInfo={false} strokeColor="#0f766e" />
              <p className="mb-0 mt-2 text-sm text-slate-600">
                {t('dashboard.pipeline.collectionRateHint', { paidCount: paidBookings, totalCount: totalBookings })}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-4">
          <SectionCard
            title={t('dashboard.sections.upcomingTitle')}
            description={t('dashboard.sections.upcomingDescription')}
            actions={
              <Button type="text" onClick={() => navigate('/bookings')} className="rounded-full font-medium text-teal-700">
                {t('shell.menu.bookings')}
              </Button>
            }
          >
            {upcomingBookings.length ? (
              <div className="divide-y divide-slate-100">
                {upcomingBookings.map((booking) => (
                  <UpcomingBookingCard
                    key={booking.id ?? booking.bookingCode}
                    booking={booking}
                    language={i18n.resolvedLanguage}
                    onOpen={() => navigate(booking.id ? `/bookings/${booking.id}` : '/bookings')}
                  />
                ))}
              </div>
            ) : (
              <div className="px-4 py-8">
                <Empty description={t('dashboard.upcoming.empty')} />
              </div>
            )}
          </SectionCard>

          {isAdmin ? (
            <SectionCard
              title={t('dashboard.sections.financeTitle')}
              description={t('dashboard.sections.financeDescription')}
            >
              <div className="grid gap-3 p-3.5 sm:grid-cols-3 sm:p-4">
                <div className="rounded-[20px] bg-slate-50 px-3.5 py-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t('dashboard.finance.collected')}
                  </p>
                  <p className="mb-0 text-lg font-semibold text-slate-900">
                    {formatCurrencyVnd(totalCollected, i18n.resolvedLanguage)}
                  </p>
                </div>
                <div className="rounded-[20px] bg-slate-50 px-3.5 py-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t('dashboard.finance.receivables')}
                  </p>
                  <p className="mb-0 text-lg font-semibold text-slate-900">
                    {formatCurrencyVnd(outstandingBalance, i18n.resolvedLanguage)}
                  </p>
                </div>
                <div className="rounded-[20px] bg-slate-50 px-3.5 py-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t('dashboard.metrics.teamMembers')}
                  </p>
                  <p className="mb-0 text-lg font-semibold text-slate-900">{teamCount}</p>
                </div>
              </div>
            </SectionCard>
          ) : null}
        </div>

        <div className="space-y-4">
          <SectionCard
            title={t('dashboard.sections.prioritiesTitle')}
            description={t('dashboard.sections.prioritiesDescription')}
          >
            <div className="space-y-3 p-3.5 sm:p-4">
              {overdueCount > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  message={t('dashboard.priorities.overdueTitle', { count: overdueCount })}
                  description={t('dashboard.priorities.overdueDescription')}
                  action={
                    <Button type="link" onClick={() => navigate('/bookings')}>
                      {t('shell.menu.bookings')}
                    </Button>
                  }
                />
              ) : null}

              {pendingCollectionsCount > 0 ? (
                <Alert
                  type="info"
                  showIcon
                  message={t('dashboard.priorities.collectionsTitle', { count: pendingCollectionsCount })}
                  description={t('dashboard.priorities.collectionsDescription')}
                  action={
                    <Button type="link" onClick={() => navigate('/bookings')}>
                      {t('dashboard.priorities.collectionsAction')}
                    </Button>
                  }
                />
              ) : null}

              {inServiceCars > 0 ? (
                <Alert
                  type="error"
                  showIcon
                  message={t('dashboard.priorities.serviceTitle', { count: inServiceCars })}
                  description={t('dashboard.priorities.serviceDescription')}
                  action={
                    <Button type="link" onClick={() => navigate('/cars')}>
                      {t('dashboard.priorities.serviceAction')}
                    </Button>
                  }
                />
              ) : null}

              {overdueCount === 0 && pendingCollectionsCount === 0 && inServiceCars === 0 ? (
                <Alert
                  type="success"
                  showIcon
                  message={t('dashboard.priorities.clearTitle')}
                  description={t('dashboard.priorities.clearDescription')}
                />
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title={t('dashboard.sections.fleetTitle')}
            description={t('dashboard.sections.fleetDescription', { rate: utilizationRate })}
          >
            <div className="space-y-4 p-3.5 sm:p-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{t('dashboard.fleet.available')}</span>
                  <span className="font-semibold text-slate-900">{availableCars}</span>
                </div>
                <Progress percent={getPercent(availableCars, fleetTotal)} showInfo={false} strokeColor="#16a34a" />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{t('dashboard.fleet.rented')}</span>
                  <span className="font-semibold text-slate-900">{rentedCars}</span>
                </div>
                <Progress percent={getPercent(rentedCars, fleetTotal)} showInfo={false} strokeColor="#0891b2" />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{t('dashboard.fleet.cleaning')}</span>
                  <span className="font-semibold text-slate-900">{cleaningCars}</span>
                </div>
                <Progress percent={getPercent(cleaningCars, fleetTotal)} showInfo={false} strokeColor="#f59e0b" />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{t('dashboard.fleet.repair')}</span>
                  <span className="font-semibold text-slate-900">{repairCars}</span>
                </div>
                <Progress percent={getPercent(repairCars, fleetTotal)} showInfo={false} strokeColor="#dc2626" />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
