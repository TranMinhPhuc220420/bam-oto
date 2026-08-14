import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'

import { db } from '../services/firebase'
import { Customer } from '../types/Customer'

interface UseCustomersOptions {
  includeInactive?: boolean
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { includeInactive = false } = options
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const customersQuery = query(collection(db, 'customers'), orderBy('fullName'))
    const unsubscribe = onSnapshot(
      customersQuery,
      (snapshot) => {
        const data = snapshot.docs.map((customerDoc) => ({
          id: customerDoc.id,
          ...customerDoc.data(),
        })) as Customer[]

        setCustomers(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching customers:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredCustomers = useMemo(
    () => (includeInactive ? customers : customers.filter((customer) => customer.isActive !== false)),
    [customers, includeInactive]
  )

  return {
    customers: filteredCustomers,
    loading,
  }
}
