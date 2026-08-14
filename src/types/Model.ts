import type { FieldValue, Timestamp } from 'firebase/firestore'

export interface CarModel {
  id?: string
  brandId: string
  name: string
  normalizedName: string
  isActive: boolean
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}
