import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'

import { db } from '../services/firebase'
import { Car } from '../types/Car'

interface UseCarsOptions {
  includeUnavailable?: boolean
}

export function useCars(options: UseCarsOptions = {}) {
  const { includeUnavailable = true } = options
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carsQuery = query(collection(db, 'cars'))
    const unsubscribe = onSnapshot(
      carsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((carDoc) => ({
          id: carDoc.id,
          ...carDoc.data(),
        })) as Car[]

        setCars(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching cars:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredCars = useMemo(() => {
    if (includeUnavailable) {
      return cars
    }

    return cars.filter((car) => car.status === 'available' || car.status === 'rented')
  }, [cars, includeUnavailable])

  return {
    cars: filteredCars,
    loading,
  }
}
