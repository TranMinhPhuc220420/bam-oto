import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'

import { db } from '../services/firebase'
import { Transaction, TransactionDirection, TransactionType } from '../types/Transaction'
import { toDate, toMillis } from '../utils/date'

interface UseTransactionsOptions {
  startDate?: Date | null
  endDate?: Date | null
  type?: TransactionType | 'all'
  direction?: TransactionDirection | 'all'
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { startDate, endDate, type = 'all', direction = 'all' } = options
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const transactionsQuery = query(collection(db, 'transactions'))
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
        console.error('Error fetching transactions:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredTransactions = useMemo(() => {
    const startTime = startDate ? startDate.getTime() : null
    const endTime = endDate ? endDate.getTime() : null

    return transactions
      .filter((transaction) => {
        if (type !== 'all' && transaction.type !== type) {
          return false
        }

        if (direction !== 'all' && transaction.direction !== direction) {
          return false
        }

        const occurredAt = toDate(transaction.paidAt ?? transaction.createdAt)
        const occurredTime = occurredAt?.getTime() ?? 0

        if (startTime && occurredTime < startTime) {
          return false
        }

        if (endTime && occurredTime > endTime) {
          return false
        }

        return true
      })
      .sort(
        (left, right) =>
          toMillis(right.paidAt ?? right.createdAt) - toMillis(left.paidAt ?? left.createdAt)
      )
  }, [direction, endDate, startDate, transactions, type])

  return {
    transactions: filteredTransactions,
    loading,
  }
}
