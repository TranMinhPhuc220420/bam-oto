import { useEffect, useMemo, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { App, Button, Segmented } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { BookingCalendar } from '../components/bookings/BookingCalendar'
import { BookingDetailDrawer } from '../components/bookings/BookingDetailDrawer'
import { BookingFilters, BookingQuickFilter } from '../components/bookings/BookingFilters'
import { BookingList } from '../components/bookings/BookingList'
import { MetricCard } from '../components/ui/MetricCard'
import { SectionCard } from '../components/ui/SectionCard'
import { useAuth } from '../hooks/useAuth'
import { useBookings } from '../hooks/useBookings'
import { deleteBookingWithGuards } from '../services/bookingService'
import type { Booking, BookingStatus, PaymentStatus } from '../types/Booking'

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

function isOverdueBooking(booking: Booking) {
  const endDate = toDate(booking.endDate)

  return !!endDate && endDate.getTime() < Date.now() && !['completed', 'canceled'].includes(booking.status)
}

export function BookingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { message } = App.useApp()
  const { profile } = useAuth()
  const { bookings, loading } = useBookings()
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all')
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [quickFilter, setQuickFilter] = useState<BookingQuickFilter>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null)

  const filteredBookings = useMemo(() => {
    const now = dayjs()
    const normalizedSearch = searchText.trim().toLowerCase()

    return bookings.filter((booking) => {
      const startDate = toDate(booking.startDate)
      const endDate = toDate(booking.endDate)
      const searchIndex = [
        booking.bookingCode,
        booking.customerSnapshot?.fullName,
        booking.customerSnapshot?.phoneNumber,
        booking.carSnapshot?.plateNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (normalizedSearch && !searchIndex.includes(normalizedSearch)) {
        return false
      }

      if (statusFilter !== 'all' && booking.status !== statusFilter) {
        return false
      }

      if (paymentFilter !== 'all' && booking.paymentStatus !== paymentFilter) {
        return false
      }

      if (dateRange) {
        if (!startDate || !endDate) {
          return false
        }

        const rangeStart = dateRange[0].startOf('day')
        const rangeEnd = dateRange[1].endOf('day')
        const bookingStart = dayjs(startDate)
        const bookingEnd = dayjs(endDate)

        if (bookingEnd.isBefore(rangeStart) || bookingStart.isAfter(rangeEnd)) {
          return false
        }
      }

      switch (quickFilter) {
        case 'today':
          return (
            (!!startDate && dayjs(startDate).isSame(now, 'day')) ||
            (!!endDate && dayjs(endDate).isSame(now, 'day'))
          )
        case 'upcoming':
          return !!startDate && dayjs(startDate).isAfter(now, 'day') && ['draft', 'confirmed'].includes(booking.status)
        case 'active':
          return booking.status === 'in-progress'
        case 'overdue':
          return isOverdueBooking(booking)
        default:
          return true
      }
    })
  }, [bookings, dateRange, paymentFilter, quickFilter, searchText, statusFilter])

  const todayPickupsCount = useMemo(
    () =>
      filteredBookings.filter((booking) => {
        const startDate = toDate(booking.startDate)
        return !!startDate && dayjs(startDate).isSame(dayjs(), 'day') && booking.status !== 'canceled'
      }).length,
    [filteredBookings]
  )

  const todayReturnsCount = useMemo(
    () =>
      filteredBookings.filter((booking) => {
        const endDate = toDate(booking.endDate)
        return !!endDate && dayjs(endDate).isSame(dayjs(), 'day') && booking.status !== 'canceled'
      }).length,
    [filteredBookings]
  )

  const activeCount = useMemo(
    () => filteredBookings.filter((booking) => booking.status === 'in-progress').length,
    [filteredBookings]
  )

  const overdueCount = useMemo(
    () => filteredBookings.filter((booking) => isOverdueBooking(booking)).length,
    [filteredBookings]
  )

  useEffect(() => {
    if (!selectedBooking?.id) {
      return
    }

    const nextSelectedBooking = bookings.find((booking) => booking.id === selectedBooking.id)

    if (!nextSelectedBooking) {
      setSelectedBooking(null)
      return
    }

    if (nextSelectedBooking !== selectedBooking) {
      setSelectedBooking(nextSelectedBooking)
    }
  }, [bookings, selectedBooking])

  const handleDeleteBooking = async (booking: Booking) => {
    if (!booking.id) {
      message.error(t('bookings.delete.blockedUnavailable'))
      return
    }

    setDeletingBookingId(booking.id)

    try {
      const result = await deleteBookingWithGuards(booking, profile?.role ?? null)

      if (!result.allowed) {
        message.error(t(result.reasonKey ?? 'bookings.delete.error'))
        return
      }

      setSelectedBooking((current) => (current?.id === booking.id ? null : current))
      message.success(t('bookings.delete.success', { bookingCode: booking.bookingCode }))
    } catch (error) {
      console.error('Error deleting booking:', error)
      message.error(t('bookings.delete.error'))
    } finally {
      setDeletingBookingId(null)
    }
  }

  const resetFilters = () => {
    setSearchText('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setDateRange(null)
    setQuickFilter('all')
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('bookings.metrics.pickups')}
          value={todayPickupsCount}
          hint={t('bookings.metrics.pickupsHint')}
          icon={<CalendarOutlined />}
        />
        <MetricCard
          label={t('bookings.metrics.returns')}
          value={todayReturnsCount}
          hint={t('bookings.metrics.returnsHint')}
          icon={<ClockCircleOutlined />}
        />
        <MetricCard
          label={t('bookings.metrics.active')}
          value={activeCount}
          hint={t('bookings.metrics.activeHint')}
          icon={<CheckCircleOutlined />}
        />
        <MetricCard
          label={t('bookings.metrics.overdue')}
          value={overdueCount}
          hint={t('bookings.metrics.overdueHint')}
          icon={<WarningOutlined />}
        />
      </div>

      <SectionCard
        title={t('bookings.page.directoryTitle')}
        description={t('bookings.page.directoryDescription')}
        actions={
          <>
            <Segmented<'list' | 'calendar'>
              value={viewMode}
              onChange={(value) => setViewMode(value)}
              options={[
                { label: t('bookings.page.listView'), value: 'list' },
                { label: t('bookings.page.calendarView'), value: 'calendar' },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/bookings/new')}
              size="large"
              className="rounded-full px-6"
            >
              {t('bookings.page.create')}
            </Button>
          </>
        }
      >
        <BookingFilters
          searchText={searchText}
          onSearchTextChange={setSearchText}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          quickFilter={quickFilter}
          onQuickFilterChange={setQuickFilter}
          resultCount={filteredBookings.length}
          onReset={resetFilters}
        />

        {viewMode === 'list' ? (
          <BookingList
            bookings={filteredBookings}
            isLoading={loading}
            onView={setSelectedBooking}
            onEdit={(booking) => navigate(`/bookings/edit/${booking.id}`)}
            onDelete={handleDeleteBooking}
            currentUserRole={profile?.role ?? null}
            deletingBookingId={deletingBookingId}
          />
        ) : (
          <BookingCalendar
            bookings={filteredBookings}
            isLoading={loading}
            onBookingSelect={setSelectedBooking}
          />
        )}
      </SectionCard>

      <BookingDetailDrawer
        booking={selectedBooking}
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onEdit={(booking) => navigate(`/bookings/edit/${booking.id}`)}
      />
    </div>
  )
}
