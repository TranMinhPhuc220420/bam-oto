import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from './firebase'
import type { Customer } from '../types/Customer'
import type { UserRole } from '../types/User'

export interface CustomerFormPayload {
  fullName: string
  phoneNumber: string
  email?: string
  governmentId?: string
  driverLicenseNumber?: string
  notes?: string
  isActive: boolean
}

export function normalizeCustomerPhoneNumber(value?: string | null) {
  const compact = value?.trim().replace(/[\s().-]/g, '') ?? ''

  if (!compact) {
    return ''
  }

  if (compact.startsWith('+84')) {
    return `0${compact.slice(3)}`
  }

  if (compact.startsWith('84') && compact.length >= 11) {
    return `0${compact.slice(2)}`
  }

  return compact
}

export function isDuplicateCustomerPhoneError(error: unknown) {
  return error instanceof Error && error.message === 'customers/duplicate-phone-number'
}

function trimText(value?: string) {
  return value?.trim() || undefined
}

export async function findCustomerByPhone(phoneNumber: string, currentCustomerId?: string) {
  const normalizedPhoneNumber = normalizeCustomerPhoneNumber(phoneNumber)

  if (!normalizedPhoneNumber) {
    return null
  }

  const snapshot = await getDocs(collection(db, 'customers'))
  const match = snapshot.docs.find((customerDoc) => {
    if (customerDoc.id === currentCustomerId) {
      return false
    }

    const savedPhoneNumber =
      typeof customerDoc.data().phoneNumber === 'string' ? customerDoc.data().phoneNumber : ''

    return normalizeCustomerPhoneNumber(savedPhoneNumber) === normalizedPhoneNumber
  })

  if (!match) {
    return null
  }

  return {
    id: match.id,
    ...match.data(),
  } as Customer
}

export async function ensureUniqueCustomerPhone(phoneNumber: string, currentCustomerId?: string) {
  const duplicate = await findCustomerByPhone(phoneNumber, currentCustomerId)

  if (duplicate) {
    throw new Error('customers/duplicate-phone-number')
  }
}

export async function saveCustomer(values: CustomerFormPayload, customerId?: string) {
  const phoneNumber = normalizeCustomerPhoneNumber(values.phoneNumber)
  await ensureUniqueCustomerPhone(phoneNumber, customerId)

  const payload = Object.fromEntries(
    Object.entries({
      fullName: values.fullName.trim(),
      phoneNumber,
      email: trimText(values.email),
      governmentId: trimText(values.governmentId),
      driverLicenseNumber: trimText(values.driverLicenseNumber),
      notes: trimText(values.notes),
      isActive: values.isActive,
      updatedAt: serverTimestamp(),
    }).filter(([, value]) => value !== undefined)
  )

  if (customerId) {
    await updateDoc(doc(db, 'customers', customerId), payload)
    return {
      id: customerId,
      ...payload,
    }
  }

  const createdDoc = await addDoc(collection(db, 'customers'), {
    ...payload,
    createdAt: serverTimestamp(),
  })

  return {
    id: createdDoc.id,
    ...payload,
  }
}

export async function setCustomerActive(customerId: string, isActive: boolean) {
  await updateDoc(doc(db, 'customers', customerId), {
    isActive,
    updatedAt: serverTimestamp(),
  })
}

export interface CustomerDeleteEligibilityResult {
  allowed: boolean
  reasonKey?: string
}

export function canDeleteCustomer(
  customer: Pick<Customer, 'id'>,
  relatedBookings: Array<{ customerId?: string }>,
  role?: UserRole | null,
): CustomerDeleteEligibilityResult {
  if (role !== 'admin') {
    return { allowed: false, reasonKey: 'customers.messages.deleteBlockedAdminOnly' }
  }

  if (!customer.id) {
    return { allowed: false, reasonKey: 'customers.messages.deleteError' }
  }

  if (relatedBookings.some((booking) => booking.customerId === customer.id)) {
    return { allowed: false, reasonKey: 'customers.messages.deleteBlockedHistory' }
  }

  return { allowed: true }
}

export async function deleteCustomerWithGuards(
  customer: Pick<Customer, 'id'>,
  role?: UserRole | null,
): Promise<CustomerDeleteEligibilityResult> {
  if (!customer.id) {
    return { allowed: false, reasonKey: 'customers.messages.deleteError' }
  }

  const relatedSnapshot = await getDocs(
    query(collection(db, 'bookings'), where('customerId', '==', customer.id)),
  )
  const relatedBookings = relatedSnapshot.docs.map((bookingDoc) => ({
    id: bookingDoc.id,
    customerId: bookingDoc.data().customerId as string | undefined,
  }))
  const eligibility = canDeleteCustomer(customer, relatedBookings, role)

  if (!eligibility.allowed) {
    return eligibility
  }

  await deleteDoc(doc(db, 'customers', customer.id))

  return { allowed: true }
}
