import type { FieldValue, Timestamp } from 'firebase/firestore'

import type { CarStatus } from './Car'

export type BookingStatus = 'draft' | 'confirmed' | 'in-progress' | 'completed' | 'canceled'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'
export type PaymentMethod = 'cash' | 'bank-transfer' | 'card' | 'other'
export type BookingExtraChargeType = 'fuel' | 'late-fee' | 'damage' | 'cleaning' | 'toll' | 'other'
export type BookingAdjustmentType = 'discount' | 'refund' | 'waiver' | 'other'
export type BookingReturnCarStatus = Exclude<CarStatus, 'rented'>

export interface BookingCarSnapshot {
  plateNumber: string
  brand?: string
  model?: string
  status?: CarStatus
}

export interface BookingCustomerSnapshot {
  fullName: string
  phoneNumber?: string
  email?: string
}

export interface BookingExtraChargeItem {
  id: string
  label: string
  amount: number
  type: BookingExtraChargeType
  note?: string
  createdAt?: Timestamp | FieldValue | Date
  createdBy?: string
}

export interface BookingAdjustmentItem {
  id: string
  label: string
  amount: number
  type: BookingAdjustmentType
  note?: string
  createdAt?: Timestamp | FieldValue | Date
  createdBy?: string
}

export interface Booking {
  id?: string
  bookingCode: string
  carId: string
  customerId: string
  startDate: Timestamp | FieldValue
  endDate: Timestamp | FieldValue
  pickupLocation: string
  returnLocation: string
  status: BookingStatus
  carReturnStatus?: BookingReturnCarStatus
  totalPrice: number
  fixedTotal?: number
  rentalAmount?: number
  depositAmount?: number
  securityDeposit?: number
  extraChargeItems?: BookingExtraChargeItem[]
  adjustmentItems?: BookingAdjustmentItem[]
  extraChargesTotal?: number
  discountRefundTotal?: number
  extraCharges?: number
  discountAmount?: number
  paidAmount?: number
  remainingAmount?: number
  refundAmount?: number
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  documentUrls?: string[]
  documentUrl?: string
  note?: string
  carSnapshot: BookingCarSnapshot
  customerSnapshot: BookingCustomerSnapshot
  transactionId?: string
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}
