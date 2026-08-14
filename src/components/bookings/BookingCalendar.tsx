import { useMemo, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { Button, Calendar, Empty, Grid, Spin, Tag } from 'antd'
import { useTranslation } from 'react-i18next'

import { Booking, BookingStatus } from '../../types/Booking'
import { toDate } from '../../utils/date'
import { EmptyCopy } from '../ui/EmptyCopy'

interface BookingCalendarProps {
  bookings: Booking[]
  isLoading: boolean
  onBookingSelect?: (booking: Booking) => void
}

const statusColors: Record<BookingStatus, string> = {
  draft: 'default',
  confirmed: 'green',
  'in-progress': 'blue',
  completed: 'purple',
  canceled: 'red',
}

function getBookingsForDay(bookings: Booking[], dateValue: Dayjs) {
  const currentDay = dateValue.startOf('day').valueOf()

  return bookings.filter((booking) => {
    const startDate = toDate(booking.startDate)
    const endDate = toDate(booking.endDate)

    if (!startDate || !endDate) {
      return false
    }

    const bookingStart = dayjs(startDate).startOf('day').valueOf()
    const bookingEnd = dayjs(endDate).startOf('day').valueOf()

    return currentDay >= bookingStart && currentDay <= bookingEnd
  })
}

function formatDateTime(value: unknown, locale: string) {
  const date = toDate(value)

  if (!date) {
    return '—'
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function BookingCalendar({ bookings, isLoading, onBookingSelect }: BookingCalendarProps) {
  const { t, i18n } = useTranslation()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-GB'
  const [selectedDate, setSelectedDate] = useState(dayjs())

  const selectedDateBookings = useMemo(
    () => getBookingsForDay(bookings, selectedDate),
    [bookings, selectedDate]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    )
  }

  if (!bookings.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        className="py-10"
        description={<EmptyCopy title={t('bookings.calendar.empty')} hint={t('bookings.list.emptyHint')} />}
      />
    )
  }

  if (isMobile) {
    return (
      <div className="space-y-3 p-3 sm:p-4">
        <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-sm font-semibold text-slate-900">{t('bookings.calendar.mobileTitle')}</p>
              <p className="mb-0 text-xs text-slate-500">{t('bookings.calendar.mobileDescription')}</p>
            </div>
            <div className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
              {selectedDateBookings.length}
            </div>
          </div>

          <Calendar
            fullscreen={false}
            value={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-2xl border border-slate-200/70 bg-white"
            fullCellRender={(current, info) => {
              if (info.type !== 'date') {
                return info.originNode
              }

              const matchedBookings = getBookingsForDay(bookings, current)
              const isSelected = current.isSame(selectedDate, 'day')
              const isToday = current.isSame(dayjs(), 'day')
              const isCurrentMonth = current.isSame(selectedDate, 'month')

              return (
                <div
                  className={[
                    'flex min-h-[52px] flex-col items-center justify-center rounded-xl px-1 py-1 text-center transition',
                    isSelected ? 'bg-teal-600 text-white shadow-sm' : 'bg-transparent',
                    !isCurrentMonth && !isSelected ? 'opacity-45' : '',
                  ].join(' ')}
                >
                  <span className="text-xs font-semibold">{current.date()}</span>
                  {matchedBookings.length ? (
                    <span
                      className={[
                        'mt-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        isSelected ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-700',
                      ].join(' ')}
                    >
                      {matchedBookings.length}
                    </span>
                  ) : isToday ? (
                    <span className={['mt-1 h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white' : 'bg-teal-500'].join(' ')} />
                  ) : null}
                </div>
              )
            }}
          />
        </div>

        <div className="rounded-[22px] border border-slate-200/80 bg-white shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3">
            <div>
              <p className="mb-1 text-sm font-semibold text-slate-900">
                {t('bookings.calendar.selectedDate', {
                  date: new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(
                    selectedDate.toDate()
                  ),
                })}
              </p>
              <p className="mb-0 text-xs text-slate-500">
                {t('bookings.calendar.selectedDateHint', { count: selectedDateBookings.length })}
              </p>
            </div>

            <Button size="small" onClick={() => setSelectedDate(dayjs())}>
              {t('common.labels.today')}
            </Button>
          </div>

          {selectedDateBookings.length ? (
            <div className="mobile-card-list p-3">
              {selectedDateBookings.map((booking) => (
                <button
                  key={booking.id ?? `${booking.bookingCode}-${selectedDate.toISOString()}`}
                  type="button"
                  className="w-full rounded-[18px] border border-slate-200/80 bg-slate-50/70 p-3 text-left transition hover:border-teal-200 hover:bg-teal-50/50"
                  onClick={() => onBookingSelect?.(booking)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mobile-clamp-1 text-sm font-semibold text-slate-900">
                        {booking.carSnapshot?.plateNumber || booking.bookingCode}
                      </div>
                      <div className="mobile-clamp-1 text-xs text-slate-500">
                        {booking.customerSnapshot?.fullName || booking.bookingCode}
                      </div>
                    </div>

                    <Tag color={statusColors[booking.status]} className="m-0 rounded-full px-2.5 py-0.5 text-[11px]">
                      {t(`bookings.status.${booking.status}`)}
                    </Tag>
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    {formatDateTime(booking.startDate, locale)} → {formatDateTime(booking.endDate, locale)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="py-8"
              description={t('bookings.calendar.selectedDateEmpty')}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <Calendar
      className="rounded-b-[28px] bg-white"
      cellRender={(current, info) => {
        if (info.type !== 'date') {
          return info.originNode
        }

        const matchedBookings = getBookingsForDay(bookings, current)

        if (!matchedBookings.length) {
          return info.originNode
        }

        return (
          <div className="space-y-1 overflow-hidden">
            {matchedBookings.slice(0, 2).map((booking) => (
              <Tag
                key={`${booking.id}-${current.toISOString()}`}
                color={statusColors[booking.status]}
                className="m-0 block cursor-pointer truncate rounded-full text-[11px]"
                onClick={() => onBookingSelect?.(booking)}
              >
                {booking.carSnapshot?.plateNumber} • {booking.customerSnapshot?.fullName}
              </Tag>
            ))}
            {matchedBookings.length > 2 ? (
              <div className="text-[11px] text-slate-500">
                {t('bookings.calendar.more', { count: matchedBookings.length - 2 })}
              </div>
            ) : null}
          </div>
        )
      }}
    />
  )
}
