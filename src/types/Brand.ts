import type { FieldValue, Timestamp } from 'firebase/firestore'

export interface CarBrand {
  id?: string
  name: string
  normalizedName: string
  isActive: boolean
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}
