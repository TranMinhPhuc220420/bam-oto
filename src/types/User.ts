export type UserRole = 'admin' | 'staff'

export interface UserProfile {
  authUid: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt?: unknown
  updatedAt?: unknown
}

export interface SignUpPayload {
  email: string
  password: string
  role: UserRole
  isActive: boolean
}
