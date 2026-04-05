import type { FieldValue, Timestamp } from 'firebase/firestore'

export interface Customer {
  id?: string
  fullName: string
  phoneNumber: string
  email?: string
  governmentId?: string
  driverLicenseNumber?: string
  notes?: string
  isActive: boolean
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}
