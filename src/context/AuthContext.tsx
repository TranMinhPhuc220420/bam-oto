import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  type User,
  type UserCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'

import { AuthContext } from './auth-context'
import { auth, createManagedUserAccount, getUserProfile } from '../services/firebase'
import type { SignUpPayload, UserProfile } from '../types/User'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) {
        return
      }

      setLoading(true)

      try {
        setCurrentUser(user)

        if (user) {
          const nextProfile = await getUserProfile(user.uid)

          if (isMounted) {
            setProfile(nextProfile)
          }
        } else {
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const value = {
    currentUser,
    profile,
    loading,
    signIn: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    signUp: (payload: SignUpPayload) => createManagedUserAccount(payload),
    signOut: () => firebaseSignOut(auth),
    resetPassword: (email: string) => sendPasswordResetEmail(auth, email),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
