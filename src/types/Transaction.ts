import type { FieldValue, Timestamp } from 'firebase/firestore'

import type { PaymentMethod, PaymentStatus } from './Booking'

export type TransactionType =
  | 'booking'
  | 'deposit'
  | 'security-deposit'
  | 'final-payment'
  | 'late-fee'
  | 'damage-fee'
  | 'surcharge'
  | 'discount'
  | 'refund'

export type TransactionDirection = 'incoming' | 'outgoing'

export interface Transaction {
  id?: string
  bookingId: string
  customerId: string
  amount: number
  status: PaymentStatus
  type: TransactionType
  direction: TransactionDirection
  method: PaymentMethod
  note?: string
  paidAt?: Timestamp | FieldValue
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}
