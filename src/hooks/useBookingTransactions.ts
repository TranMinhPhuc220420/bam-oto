import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

import { db } from '../services/firebase'
import { Transaction } from '../types/Transaction'
import { toMillis } from '../utils/date'

export function useBookingTransactions(bookingId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) {
      return
    }

    const transactionsQuery = query(collection(db, 'transactions'), where('bookingId', '==', bookingId))
    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((transactionDoc) => ({
          id: transactionDoc.id,
          ...transactionDoc.data(),
        })) as Transaction[]

        setTransactions(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching booking transactions:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [bookingId])

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (left, right) => toMillis(right.paidAt ?? right.updatedAt) - toMillis(left.paidAt ?? left.updatedAt)
      ),
    [transactions]
  )

  return {
    transactions: bookingId ? sortedTransactions : [],
    loading: bookingId ? loading : false,
  }
}
