import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'

import { db } from '../services/firebase'
import { CarBrand } from '../types/Brand'

interface UseCarBrandsOptions {
  includeInactive?: boolean
}

export function useCarBrands(options: UseCarBrandsOptions = {}) {
  const { includeInactive = false } = options
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const brandsQuery = query(collection(db, 'carBrands'), orderBy('name'))
    const unsubscribe = onSnapshot(
      brandsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((brandDoc) => ({
          id: brandDoc.id,
          ...brandDoc.data(),
        })) as CarBrand[]

        setBrands(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching car brands:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredBrands = useMemo(
    () => (includeInactive ? brands : brands.filter((brand) => brand.isActive !== false)),
    [brands, includeInactive]
  )

  return {
    brands: filteredBrands,
    loading,
  }
}
