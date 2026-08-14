import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore'

import { db } from './firebase'
import type { Booking, BookingStatus } from '../types/Booking'
import type { Car } from '../types/Car'
import type { UserRole } from '../types/User'

const blockingDeleteStatuses = new Set<BookingStatus>(['draft', 'confirmed', 'in-progress'])

export interface CarDeleteEligibilityResult {
  allowed: boolean
  reasonKey?: string
}

export function normalizeCarPlateNumber(value?: string | null) {
  return value?.trim().toUpperCase().replace(/[\s.-]/g, '') ?? ''
}

export function isDuplicateCarPlateError(error: unknown) {
  return error instanceof Error && error.message === 'cars/duplicate-plate-number'
}

export async function ensureUniqueCarPlateNumber(plateNumber: string, currentCarId?: string) {
  const normalizedPlateNumber = normalizeCarPlateNumber(plateNumber)

  if (!normalizedPlateNumber) {
    return
  }

  const snapshot = await getDocs(collection(db, 'cars'))
  const hasDuplicate = snapshot.docs.some((carDoc) => {
    if (carDoc.id === currentCarId) {
      return false
    }

    const carData = carDoc.data()
    const savedPlateNumber = typeof carData.plateNumber === 'string' ? carData.plateNumber : ''

    return normalizeCarPlateNumber(savedPlateNumber) === normalizedPlateNumber
  })

  if (hasDuplicate) {
    throw new Error('cars/duplicate-plate-number')
  }
}

export function canDeleteCar(
  car: Pick<Car, 'id' | 'everRented'>,
  relatedBookings: Array<Pick<Booking, 'status'>>,
  role?: UserRole | null
): CarDeleteEligibilityResult {
  if (role !== 'admin') {
    return { allowed: false, reasonKey: 'cars.messages.deleteBlockedAdminOnly' }
  }

  if (!car.id) {
    return { allowed: false, reasonKey: 'cars.messages.deleteError' }
  }

  const hasBlockingBooking = relatedBookings.some(
    (booking) => booking.status && blockingDeleteStatuses.has(booking.status)
  )

  if (hasBlockingBooking) {
    return { allowed: false, reasonKey: 'cars.messages.deleteBlockedActive' }
  }

  if (car.everRented || relatedBookings.length > 0) {
    return { allowed: false, reasonKey: 'cars.messages.deleteBlockedHistory' }
  }

  return { allowed: true }
}

export async function deleteCarWithGuards(
  car: Pick<Car, 'id' | 'everRented'>,
  role?: UserRole | null
): Promise<CarDeleteEligibilityResult> {
  if (!car.id) {
    return { allowed: false, reasonKey: 'cars.messages.deleteError' }
  }

  const relatedSnapshot = await getDocs(query(collection(db, 'bookings'), where('carId', '==', car.id)))
  const relatedBookings = relatedSnapshot.docs.map((bookingDoc) => bookingDoc.data() as Pick<Booking, 'status'>)
  const eligibility = canDeleteCar(car, relatedBookings, role)

  if (!eligibility.allowed) {
    return eligibility
  }

  await deleteDoc(doc(db, 'cars', car.id))

  return { allowed: true }
}
