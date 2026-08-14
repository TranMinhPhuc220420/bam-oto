import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from './firebase'
import { findCustomerByPhone, saveCustomer } from './customerService'
import { deleteBookingDocument } from './supabaseStorage'
import {
  Booking,
  BookingAdjustmentItem,
  BookingCarSnapshot,
  BookingCustomerSnapshot,
  BookingExtraChargeItem,
  BookingReturnCarStatus,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '../types/Booking'
import { Car } from '../types/Car'
import type { Transaction } from '../types/Transaction'
import { TransactionType } from '../types/Transaction'
import type { UserRole } from '../types/User'
import { toDate } from '../utils/date'

export interface BookingFormPayload {
  bookingCode?: string
  carId: string
  customerId?: string
  customerName: string
  customerPhoneNumber: string
  customerEmail?: string
  startDate: Date
  endDate: Date
  pickupLocation: string
  returnLocation: string
  status: BookingStatus
  carReturnStatus?: BookingReturnCarStatus
  totalPrice?: number
  rentalAmount?: number
  depositAmount?: number
  securityDeposit?: number
  extraChargeItems?: BookingExtraChargeItem[]
  adjustmentItems?: BookingAdjustmentItem[]
  extraCharges?: number
  discountAmount?: number
  paidAmount?: number
  refundAmount?: number
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  documentUrls?: string[]
  documentUrl?: string
  note?: string
}

const overlapBlockingStatuses = new Set<BookingStatus>(['draft', 'confirmed', 'in-progress'])
const activeRentalStatuses = new Set<BookingStatus>(['in-progress'])
const closingBookingStatuses = new Set<BookingStatus>(['completed', 'canceled'])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value instanceof Date) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

function stripUndefinedFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedFields(item))
      .filter((item) => item !== undefined) as T
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefinedFields(item)])
    ) as T
  }

  return value
}

function normalizeAmount(value: number | null | undefined) {
  return Number.isFinite(value) ? Math.max(Number(value), 0) : 0
}

function trimText(value?: string) {
  return value?.trim() ?? ''
}

function buildItemId(prefix: string, index: number) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${index}`
}

function normalizeExtraChargeItems(items?: BookingExtraChargeItem[]) {
  return (items ?? [])
    .map((item, index) => ({
      id: trimText(item.id) || buildItemId('charge', index),
      label: trimText(item.label),
      amount: normalizeAmount(item.amount),
      type: item.type ?? 'other',
      note: trimText(item.note) || undefined,
      createdAt: item.createdAt ?? new Date(),
      createdBy: trimText(item.createdBy) || undefined,
    }))
    .filter((item) => item.amount > 0 || Boolean(item.label) || Boolean(item.note))
}

function normalizeAdjustmentItems(items?: BookingAdjustmentItem[]) {
  return (items ?? [])
    .map((item, index) => ({
      id: trimText(item.id) || buildItemId('adjustment', index),
      label: trimText(item.label),
      amount: normalizeAmount(item.amount),
      type: item.type ?? 'discount',
      note: trimText(item.note) || undefined,
      createdAt: item.createdAt ?? new Date(),
      createdBy: trimText(item.createdBy) || undefined,
    }))
    .filter((item) => item.amount > 0 || Boolean(item.label) || Boolean(item.note))
}

function sumAmounts(items?: Array<{ amount?: number }>) {
  return (items ?? []).reduce((total, item) => total + normalizeAmount(item.amount), 0)
}

export function getBookingExtraChargeItems(
  values: Pick<BookingFormPayload, 'extraChargeItems' | 'extraCharges'>
) {
  const items = normalizeExtraChargeItems(values.extraChargeItems)

  if (items.length) {
    return items
  }

  const extraCharges = normalizeAmount(values.extraCharges)

  if (!extraCharges) {
    return []
  }

  return [
    {
      id: 'legacy-extra-charge',
      label: '',
      amount: extraCharges,
      type: 'other' as const,
      note: undefined,
      createdAt: new Date(),
      createdBy: undefined,
    },
  ]
}

export function getBookingAdjustmentItems(
  values: Pick<BookingFormPayload, 'adjustmentItems' | 'discountAmount' | 'refundAmount'>
) {
  const items = normalizeAdjustmentItems(values.adjustmentItems)

  if (items.length) {
    return items
  }

  const nextItems: BookingAdjustmentItem[] = []
  const discountAmount = normalizeAmount(values.discountAmount)
  const refundAmount = normalizeAmount(values.refundAmount)

  if (discountAmount > 0) {
    nextItems.push({
      id: 'legacy-discount',
      label: '',
      amount: discountAmount,
      type: 'discount',
      note: undefined,
      createdAt: new Date(),
      createdBy: undefined,
    })
  }

  if (refundAmount > 0) {
    nextItems.push({
      id: 'legacy-refund',
      label: '',
      amount: refundAmount,
      type: 'refund',
      note: undefined,
      createdAt: new Date(),
      createdBy: undefined,
    })
  }

  return nextItems
}

export function calculateBookingFinancials(
  values: Pick<
    BookingFormPayload,
    | 'totalPrice'
    | 'rentalAmount'
    | 'depositAmount'
    | 'securityDeposit'
    | 'extraChargeItems'
    | 'adjustmentItems'
    | 'extraCharges'
    | 'discountAmount'
    | 'paidAmount'
    | 'refundAmount'
    | 'paymentStatus'
  >
) {
  const rentalAmount = normalizeAmount(values.rentalAmount ?? values.totalPrice)
  const depositAmount = normalizeAmount(values.depositAmount)
  const securityDeposit = normalizeAmount(values.securityDeposit)
  const extraChargeItems = getBookingExtraChargeItems(values)
  const adjustmentItems = getBookingAdjustmentItems(values)
  const extraCharges = sumAmounts(extraChargeItems)
  const discountAmount = sumAmounts(adjustmentItems.filter((item) => item.type !== 'refund'))
  const refundAmount = sumAmounts(adjustmentItems.filter((item) => item.type === 'refund'))
  const fixedTotal = rentalAmount + depositAmount
  const discountRefundTotal = discountAmount + refundAmount
  const paidAmount = normalizeAmount(values.paidAmount)
  const totalPrice = Math.max(fixedTotal + extraCharges - discountRefundTotal, 0)
  const remainingAmount = Math.max(totalPrice - paidAmount, 0)

  let paymentStatus: PaymentStatus = values.paymentStatus

  if (refundAmount > 0) {
    paymentStatus = 'refunded'
  } else if (totalPrice > 0 && remainingAmount === 0) {
    paymentStatus = 'paid'
  } else if (paidAmount > 0) {
    paymentStatus = 'partial'
  } else {
    paymentStatus = 'unpaid'
  }

  return {
    rentalAmount,
    depositAmount,
    securityDeposit,
    fixedTotal,
    extraChargeItems,
    adjustmentItems,
    extraCharges,
    extraChargesTotal: extraCharges,
    discountAmount,
    discountRefundTotal,
    paidAmount,
    refundAmount,
    totalPrice,
    remainingAmount,
    paymentStatus,
  }
}

export function getBookingFinanceGuardMessage(
  nextStatus: BookingStatus,
  values: Pick<
    BookingFormPayload,
    | 'totalPrice'
    | 'rentalAmount'
    | 'depositAmount'
    | 'securityDeposit'
    | 'extraChargeItems'
    | 'adjustmentItems'
    | 'extraCharges'
    | 'discountAmount'
    | 'paidAmount'
    | 'refundAmount'
    | 'paymentStatus'
  >
) {
  const financials = calculateBookingFinancials(values)

  if (nextStatus === 'in-progress' && financials.depositAmount > 0 && financials.paidAmount < financials.depositAmount) {
    return 'bookings.messages.depositRequired'
  }

  if (nextStatus === 'completed' && financials.remainingAmount > 0) {
    return 'bookings.messages.settlementRequired'
  }

  return null
}

function getBookingDocumentUrls(documentUrls?: string[], documentUrl?: string) {
  return Array.from(new Set([...(documentUrls ?? []), ...(documentUrl ? [documentUrl] : [])].filter(Boolean)))
}

export interface BookingDeleteEligibilityResult {
  allowed: boolean
  reasonKey?: string
}

export function canDeleteBooking(
  booking: Pick<Booking, 'id' | 'status' | 'paymentStatus' | 'paidAmount' | 'refundAmount'>,
  role?: UserRole | null
): BookingDeleteEligibilityResult {
  if (role !== 'admin') {
    return { allowed: false, reasonKey: 'bookings.delete.blockedAdminOnly' }
  }

  if (!booking.id) {
    return { allowed: false, reasonKey: 'bookings.delete.blockedUnavailable' }
  }

  if (!['draft', 'canceled'].includes(booking.status)) {
    return { allowed: false, reasonKey: 'bookings.delete.blockedStatus' }
  }

  if (
    booking.paymentStatus !== 'unpaid' ||
    normalizeAmount(booking.paidAmount) > 0 ||
    normalizeAmount(booking.refundAmount) > 0
  ) {
    return { allowed: false, reasonKey: 'bookings.delete.blockedPayment' }
  }

  return { allowed: true }
}

export async function deleteBookingWithGuards(
  booking: Booking,
  role?: UserRole | null
): Promise<BookingDeleteEligibilityResult> {
  const eligibility = canDeleteBooking(booking, role)

  if (!eligibility.allowed || !booking.id) {
    return eligibility.allowed ? { allowed: false, reasonKey: 'bookings.delete.blockedUnavailable' } : eligibility
  }

  const transactionsSnapshot = await getDocs(query(collection(db, 'transactions'), where('bookingId', '==', booking.id)))
  const hasProtectedTransactions = transactionsSnapshot.docs.some((transactionDoc) => {
    const transaction = transactionDoc.data() as Partial<Transaction>

    return !transaction.type || transaction.type !== 'booking'
  })

  if (hasProtectedTransactions) {
    return { allowed: false, reasonKey: 'bookings.delete.blockedTransactions' }
  }

  const documentUrls = getBookingDocumentUrls(booking.documentUrls, booking.documentUrl)

  if (documentUrls.length) {
    await Promise.all(documentUrls.map((url) => deleteBookingDocument(url)))
  }

  await Promise.all(transactionsSnapshot.docs.map((transactionDoc) => deleteDoc(transactionDoc.ref)))
  await deleteDoc(doc(db, 'bookings', booking.id))
  await syncCarStatusWithBookings(booking.carId)

  return { allowed: true }
}

function buildBookingCode() {
  const now = new Date()
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`
  const randomPart = Math.floor(1000 + Math.random() * 9000)

  return `BK-${datePart}-${randomPart}`
}

function getClosingCarStatus(
  bookingStatus: BookingStatus,
  carReturnStatus?: BookingReturnCarStatus
): BookingReturnCarStatus | undefined {
  if (!closingBookingStatuses.has(bookingStatus)) {
    return undefined
  }

  if (carReturnStatus) {
    return carReturnStatus
  }

  return bookingStatus === 'completed' ? 'cleaning' : 'available'
}

function resolveCarStatusFromBookingState(
  currentStatus: Car['status'],
  options: {
    hasActiveRental: boolean
    fallbackStatus?: BookingReturnCarStatus
  }
): Car['status'] {
  if (options.hasActiveRental) {
    return 'rented'
  }

  if (options.fallbackStatus) {
    return options.fallbackStatus
  }

  if (currentStatus === 'repair' || currentStatus === 'cleaning') {
    return currentStatus
  }

  return 'available'
}

function buildCarSnapshot(car: Car, statusOverride?: Car['status']): BookingCarSnapshot {
  return stripUndefinedFields({
    plateNumber: car.plateNumber,
    brand: car.brand,
    model: car.model,
    status: statusOverride ?? car.status,
  }) as BookingCarSnapshot
}

export function isBookingTransitionAllowed(currentStatus: BookingStatus, nextStatus: BookingStatus) {
  const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
    draft: ['draft', 'confirmed', 'canceled'],
    confirmed: ['confirmed', 'in-progress', 'canceled'],
    'in-progress': ['in-progress', 'completed', 'canceled'],
    completed: ['completed'],
    canceled: ['canceled'],
  }

  return allowedTransitions[currentStatus].includes(nextStatus)
}

export async function getCarById(carId: string) {
  const carSnapshot = await getDoc(doc(db, 'cars', carId))

  if (!carSnapshot.exists()) {
    return null
  }

  return {
    id: carSnapshot.id,
    ...carSnapshot.data(),
  } as Car
}

export async function ensureCustomerRecord(
  values: Pick<BookingFormPayload, 'customerId' | 'customerName' | 'customerPhoneNumber' | 'customerEmail'>
) {
  const customerSnapshot = stripUndefinedFields({
    fullName: values.customerName.trim(),
    phoneNumber: values.customerPhoneNumber.trim(),
    email: values.customerEmail?.trim() || undefined,
  }) as BookingCustomerSnapshot

  if (values.customerId) {
    return {
      customerId: values.customerId,
      customerSnapshot,
    }
  }

  const existingCustomer = customerSnapshot.phoneNumber
    ? await findCustomerByPhone(customerSnapshot.phoneNumber)
    : null

  if (existingCustomer?.id) {
    return {
      customerId: existingCustomer.id,
      customerSnapshot,
    }
  }

  const createdCustomer = await saveCustomer({
    fullName: customerSnapshot.fullName,
    phoneNumber: customerSnapshot.phoneNumber || '',
    email: customerSnapshot.email,
    isActive: true,
  })

  return {
    customerId: createdCustomer.id,
    customerSnapshot,
  }
}

export async function isCarAvailable(
  carId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
) {
  const existingBookings = await getDocs(query(collection(db, 'bookings'), where('carId', '==', carId)))

  return !existingBookings.docs.some((bookingDoc) => {
    if (bookingDoc.id === excludeBookingId) {
      return false
    }

    const booking = bookingDoc.data() as Partial<Booking>

    if (!booking.status || !overlapBlockingStatuses.has(booking.status)) {
      return false
    }

    const existingStart = toDate(booking.startDate)
    const existingEnd = toDate(booking.endDate)

    if (!existingStart || !existingEnd) {
      return false
    }

    return startDate < existingEnd && endDate > existingStart
  })
}

export async function syncCarStatusWithBookings(
  carId: string,
  options?: { fallbackStatus?: BookingReturnCarStatus }
) {
  const car = await getCarById(carId)

  if (!car?.id) {
    return
  }

  const existingBookings = await getDocs(query(collection(db, 'bookings'), where('carId', '==', carId)))
  const relatedBookings = existingBookings.docs.map((bookingDoc) => bookingDoc.data() as Partial<Booking>)
  const hasActiveRental = relatedBookings.some((booking) => {
    const status = booking.status

    return typeof status === 'string' && activeRentalStatuses.has(status as BookingStatus)
  })
  const hasRentalHistory = relatedBookings.some(
    (booking) => booking.status === 'confirmed' || booking.status === 'in-progress' || booking.status === 'completed'
  )
  const nextStatus = resolveCarStatusFromBookingState(car.status, {
    hasActiveRental,
    fallbackStatus: options?.fallbackStatus,
  })
  const nextEverRented = Boolean(car.everRented) || hasRentalHistory

  if (car.status === nextStatus && Boolean(car.everRented) === nextEverRented) {
    return
  }

  await updateDoc(doc(db, 'cars', carId), {
    status: nextStatus,
    everRented: nextEverRented,
    updatedAt: serverTimestamp(),
  })
}

export async function prepareBookingPayload(
  values: BookingFormPayload,
  existingBookingCode?: string,
  options?: { forUpdate?: boolean }
) {
  const car = await getCarById(values.carId)

  if (!car) {
    throw new Error('Selected car could not be found.')
  }

  const { customerId, customerSnapshot } = await ensureCustomerRecord(values)

  const documentUrls = (values.documentUrls ?? (values.documentUrl ? [values.documentUrl] : []))
    .map((url) => url.trim())
    .filter(Boolean)
  const financials = calculateBookingFinancials(values)

  const closingCarStatus = getClosingCarStatus(values.status, values.carReturnStatus)

  return stripUndefinedFields({
    bookingCode: existingBookingCode ?? values.bookingCode ?? buildBookingCode(),
    carId: values.carId,
    customerId,
    startDate: values.startDate,
    endDate: values.endDate,
    pickupLocation: values.pickupLocation.trim(),
    returnLocation: values.returnLocation.trim(),
    status: values.status,
    carReturnStatus: closingCarStatus ?? (options?.forUpdate ? deleteField() : undefined),
    totalPrice: financials.totalPrice,
    fixedTotal: financials.fixedTotal,
    rentalAmount: financials.rentalAmount,
    depositAmount: financials.depositAmount,
    securityDeposit: financials.securityDeposit,
    extraChargeItems: financials.extraChargeItems.length ? financials.extraChargeItems : options?.forUpdate ? deleteField() : undefined,
    adjustmentItems: financials.adjustmentItems.length ? financials.adjustmentItems : options?.forUpdate ? deleteField() : undefined,
    extraCharges: financials.extraCharges,
    extraChargesTotal: financials.extraChargesTotal,
    discountAmount: financials.discountAmount,
    discountRefundTotal: financials.discountRefundTotal,
    paidAmount: financials.paidAmount,
    remainingAmount: financials.remainingAmount,
    refundAmount: financials.refundAmount,
    paymentStatus: financials.paymentStatus,
    paymentMethod: values.paymentMethod ?? 'other',
    documentUrls: documentUrls.length ? documentUrls : options?.forUpdate ? deleteField() : undefined,
    documentUrl: documentUrls[0] ?? (options?.forUpdate ? deleteField() : undefined),
    note: values.note?.trim() || undefined,
    carSnapshot: buildCarSnapshot(
      car,
      resolveCarStatusFromBookingState(car.status, {
        hasActiveRental: activeRentalStatuses.has(values.status),
        fallbackStatus: closingCarStatus,
      })
    ),
    customerSnapshot,
  })
}

export async function syncBookingTransaction(
  bookingId: string,
  values: Pick<
    Booking,
    'customerId' | 'totalPrice' | 'paymentStatus' | 'paidAmount' | 'remainingAmount' | 'paymentMethod' | 'refundAmount'
  > & { paymentNote?: string },
  previousValues?: Pick<
    Booking,
    'totalPrice' | 'paymentStatus' | 'paidAmount' | 'remainingAmount' | 'paymentMethod' | 'refundAmount'
  >
) {
  const paidAmount = normalizeAmount(values.paidAmount)
  const refundAmount = normalizeAmount(values.refundAmount)
  const remainingAmount = normalizeAmount(values.remainingAmount)
  const totalPrice = normalizeAmount(values.totalPrice)
  const previousPaidAmount = normalizeAmount(previousValues?.paidAmount)
  const previousRefundAmount = normalizeAmount(previousValues?.refundAmount)
  const previousTotalPrice = normalizeAmount(previousValues?.totalPrice)

  const paidDelta = paidAmount > previousPaidAmount ? paidAmount - previousPaidAmount : 0
  const refundDelta = refundAmount > previousRefundAmount ? refundAmount - previousRefundAmount : 0
  const hasMeaningfulFinanceChange = !previousValues || paidDelta > 0 || refundDelta > 0 || totalPrice !== previousTotalPrice

  if (!hasMeaningfulFinanceChange) {
    return
  }

  let transactionType: TransactionType = 'booking'
  let amount = totalPrice
  let direction: 'incoming' | 'outgoing' = 'incoming'

  if (refundDelta > 0) {
    transactionType = 'refund'
    amount = refundDelta
    direction = 'outgoing'
  } else if (paidDelta > 0) {
    transactionType = remainingAmount === 0 ? 'final-payment' : 'deposit'
    amount = paidDelta
  } else if (totalPrice !== previousTotalPrice) {
    transactionType = 'booking'
    amount = totalPrice
  }

  if (amount <= 0) {
    return
  }

  const transactionPayload = stripUndefinedFields({
    bookingId,
    customerId: values.customerId,
    amount,
    status: values.paymentStatus,
    type: transactionType,
    direction,
    method: values.paymentMethod ?? 'other',
    note: trimText(values.paymentNote) || undefined,
    paidAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await addDoc(collection(db, 'transactions'), transactionPayload)
}
