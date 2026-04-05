import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'

import { db } from '../services/firebase'
import { Booking, BookingStatus } from '../types/Booking'

interface UseBookingsOptions {
  statuses?: BookingStatus[]
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { statuses } = options
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((bookingDoc) => ({
          id: bookingDoc.id,
          ...bookingDoc.data(),
        })) as Booking[]

        setBookings(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching bookings:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredBookings = useMemo(() => {
    if (!statuses?.length) {
      return bookings
    }

    return bookings.filter((booking) => statuses.includes(booking.status))
  }, [bookings, statuses])

  return {
    bookings: filteredBookings,
    loading,
  }
}
