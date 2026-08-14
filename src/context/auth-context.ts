import { createContext } from 'react'
import type { User, UserCredential } from 'firebase/auth'

import type { SignUpPayload, UserProfile } from '../types/User'

export interface AuthContextValue {
  currentUser: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserCredential>
  signUp: (payload: SignUpPayload) => Promise<User>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
