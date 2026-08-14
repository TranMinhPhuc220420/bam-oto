import {
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Button, Empty, Grid, Progress, Skeleton } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { EmptyCopy } from '../components/ui/EmptyCopy'
import { MetricCard } from '../components/ui/MetricCard'
import { SectionCard } from '../components/ui/SectionCard'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'
import type { Booking, BookingStatus } from '../types/Booking'
import { getCurrencyLocale } from '../utils/currency'
import { toDate } from '../utils/date'
import { MoneyText } from '../components/ui/MoneyText'

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
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
              getBookingStatusColor(booking.status) === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : getBookingStatusColor(booking.status) === 'processing'
                  ? 'bg-cyan-50 text-cyan-700'
                  : getBookingStatusColor(booking.status) === 'error'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-amber-50 text-amber-700'
            }`}>
              {t(`bookings.status.${booking.status}`)}
            </span>
          </div>
          <p className="mobile-clamp-1 mb-0 text-sm text-slate-600">
            {booking.customerSnapshot?.fullName || t('dashboard.upcoming.customerFallback')}
          </p>
        </div>
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
    customerCount,
    teamCount,
    totalCollected,
    outstandingBalance,
    rentedCars,
    cleaningCars,
    repairCars,
    fleetTotal,
    utilizationRate,
    upcomingBookings,
    isAdmin,
    loading,
  } = useDashboardMetrics()

  const todayMetrics = [
    {
      key: 'pickups',
      label: t('dashboard.metrics.todayPickups'),
      value: todayPickups,
      hint: t('dashboard.metrics.todayPickupsHint'),
      icon: <ClockCircleOutlined />,
      onClick: () => navigate('/bookings?scope=today'),
    },
    {
      key: 'returns',
      label: t('dashboard.metrics.todayReturns'),
      value: todayReturns,
      hint: t('dashboard.metrics.todayReturnsHint'),
      icon: <CarOutlined />,
      onClick: () => navigate('/bookings?scope=today'),
    },
    {
      key: 'overdue',
      label: t('dashboard.metrics.overdueBookings'),
      value: overdueCount,
      hint: t('dashboard.metrics.overdueBookingsHint'),
      icon: <WarningOutlined />,
      onClick: () => navigate('/bookings?scope=overdue'),
    },
    {
      key: 'available',
      label: t('dashboard.metrics.availableCars'),
      value: availableCars,
      hint: t('dashboard.metrics.availableCarsHint'),
      icon: <CheckCircleOutlined />,
      onClick: () => navigate('/cars'),
    },
  ]

  const pipelineMetrics = [
    {
      key: 'draft',
      label: t('bookings.status.draft'),
      hint: t('bookings.statusHint.draft'),
      value: draftBookings,
      className: 'border-amber-100 bg-amber-50 text-amber-800',
    },
    {
      key: 'confirmed',
      label: t('bookings.status.confirmed'),
      hint: t('bookings.statusHint.confirmed'),
      value: confirmedBookings,
      className: 'border-cyan-100 bg-cyan-50 text-cyan-800',
    },
    {
      key: 'active',
      label: t('bookings.status.in-progress'),
      hint: t('bookings.statusHint.in-progress'),
      value: activeRentals,
      className: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    },
    {
      key: 'completed',
      label: t('bookings.status.completed'),
      hint: t('bookings.statusHint.completed'),
      value: completedBookings,
      className: 'border-slate-200 bg-slate-50 text-slate-800',
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
      <div className="flex justify-end">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/bookings/new')}
          size={screens.md ? 'large' : 'middle'}
          className="rounded-full px-5"
        >
          {t('bookings.page.create')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {todayMetrics.map((metric) => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
            icon={metric.icon}
            onClick={metric.onClick}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {pipelineMetrics.map((metric) => (
          <div key={metric.key} className={`rounded-[18px] border px-3.5 py-3 ${metric.className}`}>
            <p className="mb-1 text-sm font-medium">{metric.label}</p>
            <p className="mb-1 text-2xl font-semibold">{metric.value}</p>
            <p className="mb-0 text-xs leading-4 opacity-80">{metric.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <SectionCard
          title={t('dashboard.sections.upcomingTitle')}
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
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <EmptyCopy title={t('dashboard.upcoming.empty')} hint={t('dashboard.upcoming.emptyHint')} />
                }
              />
            </div>
          )}
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title={t('dashboard.sections.fleetTitle')} description={t('dashboard.sections.fleetDescription', { rate: utilizationRate })}>
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

          {isAdmin ? (
            <SectionCard title={t('dashboard.sections.financeTitle')}>
              <div className="grid gap-3 p-3.5 sm:grid-cols-3 sm:p-4">
                <div className="rounded-[20px] bg-slate-50 px-3.5 py-3">
                  <p className="mb-1 text-sm text-slate-500">{t('dashboard.finance.collected')}</p>
                  <p className="mb-0 text-lg font-semibold text-slate-900">
                    <MoneyText value={totalCollected} language={i18n.resolvedLanguage} />
                  </p>
                </div>
                <div className="rounded-[20px] bg-slate-50 px-3.5 py-3">
                  <p className="mb-1 text-sm text-slate-500">{t('dashboard.finance.receivables')}</p>
                  <p className="mb-0 text-lg font-semibold text-slate-900">
                    <MoneyText value={outstandingBalance} language={i18n.resolvedLanguage} />
                  </p>
                </div>
                <div className="rounded-[20px] bg-slate-50 px-3.5 py-3">
                  <p className="mb-1 text-sm text-slate-500">{t('dashboard.pipeline.collectionRate')}</p>
                  <p className="mb-0 text-lg font-semibold text-slate-900">{collectionRate}%</p>
                  <p className="mb-0 mt-1 text-xs text-slate-500">
                    {t('dashboard.pipeline.collectionRateHint', { paidCount: paidBookings, totalCount: totalBookings })}
                  </p>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard title={t('dashboard.metrics.customers')}>
              <div className="grid gap-3 p-3.5 sm:grid-cols-2 sm:p-4">
                <div className="rounded-[20px] bg-slate-50 px-3.5 py-3">
                  <p className="mb-1 text-sm text-slate-500">{t('dashboard.metrics.customers')}</p>
                  <p className="mb-0 text-lg font-semibold text-slate-900">{customerCount}</p>
                </div>
                <div className="rounded-[20px] bg-slate-50 px-3.5 py-3">
                  <p className="mb-1 text-sm text-slate-500">{t('dashboard.metrics.teamMembers')}</p>
                  <p className="mb-0 text-lg font-semibold text-slate-900">{teamCount}</p>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
