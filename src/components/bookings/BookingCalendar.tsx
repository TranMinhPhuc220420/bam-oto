import dayjs from 'dayjs'
import { Calendar, Empty, Spin, Tag } from 'antd'
import { useTranslation } from 'react-i18next'

import { Booking, BookingStatus } from '../../types/Booking'

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

export function BookingCalendar({ bookings, isLoading, onBookingSelect }: BookingCalendarProps) {
  const { t } = useTranslation()
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
        description={t('bookings.calendar.empty')}
      />
    )
  }

  return (
    <Calendar
      className="rounded-b-[28px] bg-white"
      cellRender={(current, info) => {
        if (info.type !== 'date') {
          return info.originNode
        }

        const matchedBookings = bookings.filter((booking) => {
          const startDate = toDate(booking.startDate)
          const endDate = toDate(booking.endDate)

          if (!startDate || !endDate) {
            return false
          }

          const currentDay = current.startOf('day').valueOf()
          const bookingStart = dayjs(startDate).startOf('day').valueOf()
          const bookingEnd = dayjs(endDate).startOf('day').valueOf()

          return currentDay >= bookingStart && currentDay <= bookingEnd
        })

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
