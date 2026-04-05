import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'

import { db } from '../services/firebase'
import { CarModel } from '../types/Model'

interface UseCarModelsOptions {
  includeInactive?: boolean
}

export function useCarModels(brandId?: string, options: UseCarModelsOptions = {}) {
  const { includeInactive = false } = options
  const [models, setModels] = useState<CarModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const modelsQuery = query(collection(db, 'carModels'), orderBy('name'))
    const unsubscribe = onSnapshot(
      modelsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((modelDoc) => ({
          id: modelDoc.id,
          ...modelDoc.data(),
        })) as CarModel[]

        setModels(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching car models:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesBrand = brandId ? model.brandId === brandId : true
      const matchesStatus = includeInactive ? true : model.isActive !== false

      return matchesBrand && matchesStatus
    })
  }, [brandId, includeInactive, models])

  return {
    models: filteredModels,
    loading,
  }
}
