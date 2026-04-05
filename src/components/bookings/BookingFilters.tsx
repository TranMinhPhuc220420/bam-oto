import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, DatePicker, Input, Segmented, Select, Typography } from 'antd'
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

  return (
    <div className="space-y-4 border-b border-slate-200/70 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<BookingQuickFilter>
          value={quickFilter}
          onChange={onQuickFilterChange}
          options={[
            { label: t('bookings.filters.scope.all'), value: 'all' },
            { label: t('bookings.filters.scope.today'), value: 'today' },
            { label: t('bookings.filters.scope.upcoming'), value: 'upcoming' },
            { label: t('bookings.filters.scope.active'), value: 'active' },
            { label: t('bookings.filters.scope.overdue'), value: 'overdue' },
          ]}
        />

        <div className="flex items-center gap-3">
          <Typography.Text className="text-sm text-slate-500">
            {t('bookings.filters.results', { count: resultCount })}
          </Typography.Text>
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            {t('bookings.filters.reset')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          allowClear
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={t('bookings.filters.searchPlaceholder')}
        />

        <Select
          value={statusFilter}
          onChange={onStatusFilterChange}
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
          value={paymentFilter}
          onChange={onPaymentFilterChange}
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
          value={dateRange}
          onChange={(value) => onDateRangeChange(value as [Dayjs, Dayjs] | null)}
          format="DD/MM/YYYY"
        />
      </div>
    </div>
  )
}
