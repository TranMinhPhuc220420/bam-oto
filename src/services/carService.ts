import { collection, getDocs } from 'firebase/firestore'

import { db } from './firebase'

export function normalizeCarPlateNumber(value?: string | null) {
  return value?.trim().toUpperCase().replace(/\s+/g, '') ?? ''
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
