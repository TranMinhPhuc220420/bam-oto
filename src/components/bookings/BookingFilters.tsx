import { useState } from 'react'
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Button, DatePicker, Drawer, Grid, Input, Popover, Segmented, Select } from 'antd'
import type { Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'

import type { BookingStatus, PaymentStatus } from '../../types/Booking'

export type BookingQuickFilter = 'all' | 'today' | 'upcoming' | 'active' | 'overdue'
type BookingSelectFilter<T extends string> = T | 'all'

interface BookingFiltersProps {
  searchText: string
  onSearchTextChange: (value: string) => void
  statusFilter: BookingSelectFilter<BookingStatus>
  onStatusFilterChange: (value: BookingSelectFilter<BookingStatus>) => void
  paymentFilter: BookingSelectFilter<PaymentStatus>
  onPaymentFilterChange: (value: BookingSelectFilter<PaymentStatus>) => void
  dateRange: [Dayjs, Dayjs] | null
  onDateRangeChange: (value: [Dayjs, Dayjs] | null) => void
  quickFilter: BookingQuickFilter
  onQuickFilterChange: (value: BookingQuickFilter) => void
  resultCount: number
  onReset: () => void
}

export function BookingFilters({
  searchText,
  onSearchTextChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  dateRange,
  onDateRangeChange,
  quickFilter,
  onQuickFilterChange,
  resultCount,
  onReset,
}: BookingFiltersProps) {
  const { t } = useTranslation()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const [open, setOpen] = useState(false)
  const [draftSearchText, setDraftSearchText] = useState(searchText)
  const [draftStatusFilter, setDraftStatusFilter] = useState<BookingSelectFilter<BookingStatus>>(statusFilter)
  const [draftPaymentFilter, setDraftPaymentFilter] = useState<BookingSelectFilter<PaymentStatus>>(paymentFilter)
  const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs] | null>(dateRange)
  const [draftQuickFilter, setDraftQuickFilter] = useState<BookingQuickFilter>(quickFilter)

  const syncDraftFilters = () => {
    setDraftSearchText(searchText)
    setDraftStatusFilter(statusFilter)
    setDraftPaymentFilter(paymentFilter)
    setDraftDateRange(dateRange)
    setDraftQuickFilter(quickFilter)
  }

  const openFilters = () => {
    syncDraftFilters()
    setOpen(true)
  }

  const hasActiveFilters =
    searchText.trim().length > 0 || statusFilter !== 'all' || paymentFilter !== 'all' || !!dateRange || quickFilter !== 'all'

  const quickFilterOptions = [
    {
      label: isMobile ? (
        <span className="h-[40px] flex items-center justify-center" aria-label={t('bookings.filters.scope.all')}>
          <AppstoreOutlined />
        </span>
      ) : (
        t('bookings.filters.scope.all')
      ),
      value: 'all',
    },
    {
      label: isMobile ? (
        <span className="h-[40px] flex items-center justify-center" aria-label={t('bookings.filters.scope.today')}>
          <CalendarOutlined />
        </span>
      ) : (
        t('bookings.filters.scope.today')
      ),
      value: 'today',
    },
    {
      label: isMobile ? (
        <span className="h-[40px] flex items-center justify-center" aria-label={t('bookings.filters.scope.upcoming')}>
          <ClockCircleOutlined />
        </span>
      ) : (
        t('bookings.filters.scope.upcoming')
      ),
      value: 'upcoming',
    },
    {
      label: isMobile ? (
        <span className="h-[40px] flex items-center justify-center" aria-label={t('bookings.filters.scope.active')}>
          <CheckCircleOutlined />
        </span>
      ) : (
        t('bookings.filters.scope.active')
      ),
      value: 'active',
    },
    {
      label: isMobile ? (
        <span className="h-[40px] flex items-center justify-center" aria-label={t('bookings.filters.scope.overdue')}>
          <WarningOutlined />
        </span>
      ) : (
        t('bookings.filters.scope.overdue')
      ),
      value: 'overdue',
    },
  ] satisfies Array<{ label: React.ReactNode; value: BookingQuickFilter }>

  const applyFilters = () => {
    onSearchTextChange(draftSearchText)
    onStatusFilterChange(draftStatusFilter)
    onPaymentFilterChange(draftPaymentFilter)
    onDateRangeChange(draftDateRange)
    onQuickFilterChange(draftQuickFilter)
    setOpen(false)
  }

  const handleResetFilters = () => {
    onReset()
    setDraftSearchText('')
    setDraftStatusFilter('all')
    setDraftPaymentFilter('all')
    setDraftDateRange(null)
    setDraftQuickFilter('all')
    setOpen(false)
  }

  const filterPanel = (
    <form
      className="w-full space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        applyFilters()
      }}
    >
      <Input
        allowClear
        autoFocus
        size={isMobile ? 'large' : 'middle'}
        value={draftSearchText}
        onChange={(event) => setDraftSearchText(event.target.value)}
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder={t('bookings.filters.searchPlaceholder')}
      />

      <Segmented<BookingQuickFilter>
        block
        size={isMobile ? 'middle' : 'small'}
        value={draftQuickFilter}
        onChange={setDraftQuickFilter}
        options={quickFilterOptions}
      />

      <div className="grid gap-3">
        <Select
          value={draftStatusFilter}
          size={isMobile ? 'large' : 'middle'}
          onChange={setDraftStatusFilter}
          options={[
            { value: 'all', label: t('bookings.filters.statusAll') },
            { value: 'draft', label: t('bookings.status.draft') },
            { value: 'confirmed', label: t('bookings.status.confirmed') },
            { value: 'in-progress', label: t('bookings.status.in-progress') },
            { value: 'completed', label: t('bookings.status.completed') },
            { value: 'canceled', label: t('bookings.status.canceled') },
          ]}
        />

        <Select
          value={draftPaymentFilter}
          size={isMobile ? 'large' : 'middle'}
          onChange={setDraftPaymentFilter}
          options={[
            { value: 'all', label: t('bookings.filters.paymentAll') },
            { value: 'unpaid', label: t('bookings.paymentStatus.unpaid') },
            { value: 'partial', label: t('bookings.paymentStatus.partial') },
            { value: 'paid', label: t('bookings.paymentStatus.paid') },
            { value: 'refunded', label: t('bookings.paymentStatus.refunded') },
          ]}
        />

        <DatePicker.RangePicker
          className="w-full"
          size={isMobile ? 'large' : 'middle'}
          value={draftDateRange}
          onChange={(value) => setDraftDateRange(value as [Dayjs, Dayjs] | null)}
          format="DD/MM/YYYY"
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-slate-500">{t('bookings.filters.results', { count: resultCount })}</span>
        <div className="flex items-center gap-2">
          <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
            {t('bookings.filters.reset')}
          </Button>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            {t('common.actions.search')}
          </Button>
        </div>
      </div>
    </form>
  )

  const triggerButton = (
    <Button
      type={hasActiveFilters ? 'primary' : 'default'}
      icon={<SearchOutlined />}
      shape="circle"
      size={isMobile ? 'small' : 'middle'}
      aria-label={t('common.actions.search')}
      title={t('common.actions.search')}
    />
  )

  if (isMobile) {
    return (
      <>
        <span onClick={openFilters}>{triggerButton}</span>
        <Drawer
          title={t('bookings.filters.more')}
          placement="bottom"
          height="auto"
          open={open}
          onClose={() => setOpen(false)}
          destroyOnHidden
          styles={{ body: { paddingTop: 8, paddingBottom: 24 } }}
        >
          {filterPanel}
        </Drawer>
      </>
    )
  }

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          syncDraftFilters()
        }

        setOpen(nextOpen)
      }}
      content={<div className="w-[320px] max-w-[80vw]">{filterPanel}</div>}
    >
      {triggerButton}
    </Popover>
  )
}
