import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { collection, onSnapshot, query } from 'firebase/firestore'

import { useAuth } from './useAuth'
import { useBookings } from './useBookings'
import { useCars } from './useCars'
import { useCustomers } from './useCustomers'
import { db } from '../services/firebase'
import type { Booking } from '../types/Booking'
import type { UserProfile } from '../types/User'

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

function getOutstandingAmount(booking: Booking) {
  const fallbackRemaining = Number(booking.totalPrice ?? 0) - Number(booking.paidAmount ?? 0)
  return Math.max(Number(booking.remainingAmount ?? fallbackRemaining), 0)
}

export function useDashboardMetrics() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const { bookings, loading: bookingsLoading } = useBookings()
  const { cars, loading: carsLoading } = useCars()
  const { customers, loading: customersLoading } = useCustomers({ includeInactive: true })
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([])
  const [teamResolved, setTeamResolved] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    const usersQuery = query(collection(db, 'users'))
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const data = snapshot.docs.map((userDoc) => ({
          authUid: userDoc.id,
          ...userDoc.data(),
        })) as UserProfile[]

        setTeamMembers(data)
        setTeamResolved(true)
      },
      (error) => {
        console.error('Error fetching dashboard users:', error)
        setTeamResolved(true)
      }
    )

    return () => unsubscribe()
  }, [isAdmin])

  const metrics = useMemo(() => {
    const today = dayjs()

    const draftBookings = bookings.filter((booking) => booking.status === 'draft').length
    const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed').length
    const activeRentals = bookings.filter((booking) => booking.status === 'in-progress').length
    const completedBookings = bookings.filter((booking) => booking.status === 'completed').length
    const paidBookings = bookings.filter((booking) => booking.paymentStatus === 'paid').length
    const todayPickups = bookings.filter((booking) => {
      const startDate = toDate(booking.startDate)
      return !!startDate && dayjs(startDate).isSame(today, 'day') && booking.status !== 'canceled'
    }).length

    const todayReturns = bookings.filter((booking) => {
      const endDate = toDate(booking.endDate)
      return !!endDate && dayjs(endDate).isSame(today, 'day') && booking.status !== 'canceled'
    }).length

    const overdueBookings = bookings.filter((booking) => isOverdueBooking(booking))
    const pendingCollections = bookings.filter(
      (booking) => !['completed', 'canceled'].includes(booking.status) && getOutstandingAmount(booking) > 0
    )

    const availableCars = cars.filter((car) => car.status === 'available').length
    const rentedCars = cars.filter((car) => car.status === 'rented').length
    const cleaningCars = cars.filter((car) => car.status === 'cleaning').length
    const repairCars = cars.filter((car) => car.status === 'repair').length
    const inServiceCars = cleaningCars + repairCars

    const upcomingBookings = [...bookings]
      .filter((booking) => {
        if (booking.status === 'canceled') {
          return false
        }

        const startDate = toDate(booking.startDate)
        if (!startDate) {
          return booking.status === 'in-progress'
        }

        return dayjs(startDate).isSame(today, 'day') || dayjs(startDate).isAfter(today.startOf('day')) || booking.status === 'in-progress'
      })
      .sort((left, right) => {
        const leftDate = toDate(left.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
        const rightDate = toDate(right.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
        return leftDate - rightDate
      })
      .slice(0, 6)

    const activeCustomers = customers.filter((customer) => customer.isActive !== false).length
    const activeTeamMembers = teamMembers.filter((member) => member.isActive !== false).length
    const totalCollected = bookings.reduce((total, booking) => total + Math.max(Number(booking.paidAmount ?? 0), 0), 0)
    const outstandingBalance = bookings.reduce(
      (total, booking) => total + (booking.status === 'canceled' ? 0 : getOutstandingAmount(booking)),
      0
    )
    const collectionBase = totalCollected + outstandingBalance
    const collectionRate = collectionBase ? Math.round((totalCollected / collectionBase) * 100) : 0

    return {
      totalBookings: bookings.length,
      draftBookings,
      confirmedBookings,
      activeRentals,
      completedBookings,
      paidBookings,
      collectionRate,
      todayPickups,
      todayReturns,
      overdueCount: overdueBookings.length,
      pendingCollectionsCount: pendingCollections.length,
      customerCount: activeCustomers,
      teamCount: activeTeamMembers,
      totalCollected,
      outstandingBalance,
      availableCars,
      rentedCars,
      cleaningCars,
      repairCars,
      inServiceCars,
      fleetTotal: cars.length,
      utilizationRate: cars.length ? Math.round((rentedCars / cars.length) * 100) : 0,
      upcomingBookings,
    }
  }, [bookings, cars, customers, teamMembers])

  return {
    ...metrics,
    isAdmin,
    loading: bookingsLoading || carsLoading || customersLoading || (isAdmin && !teamResolved),
  }
}
