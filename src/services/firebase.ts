import { deleteApp, getApp, getApps, initializeApp } from 'firebase/app'
import {
  type User,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

import type { SignUpPayload, UserProfile } from '../types/User'

type TranslateFn = (key: string) => string

function getRequiredEnvVar(key: string): string {
  const value = import.meta.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

const firebaseConfig = {
  apiKey: getRequiredEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getRequiredEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getRequiredEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getRequiredEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getRequiredEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getRequiredEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)

export async function createManagedUserAccount(payload: SignUpPayload): Promise<User> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-auth-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      payload.email,
      payload.password,
    )

    await setDoc(doc(db, 'users', credential.user.uid), {
      authUid: credential.user.uid,
      email: payload.email,
      role: payload.role,
      isActive: payload.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    await sendEmailVerification(credential.user).catch(() => undefined)

    return credential.user
  } catch (error) {
    if (secondaryAuth.currentUser) {
      await deleteUser(secondaryAuth.currentUser).catch(() => undefined)
    }

    throw error
  } finally {
    await secondaryAuth.signOut().catch(() => undefined)
    await deleteApp(secondaryApp).catch(() => undefined)
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', userId))

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as UserProfile
}

export function getFirebaseAuthErrorMessage(error: unknown, translate?: TranslateFn): string {
  const getMessage = (key: string, fallback: string) => (translate ? translate(key) : fallback)

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return getMessage('auth.errors.emailInUse', 'This email address is already in use.')
      case 'auth/invalid-email':
        return getMessage('auth.errors.invalidEmail', 'Please enter a valid email address.')
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return getMessage('auth.errors.wrongCredentials', 'The email or password is incorrect.')
      case 'auth/weak-password':
        return getMessage('auth.errors.weakPassword', 'Password must be at least 6 characters long.')
      case 'auth/too-many-requests':
        return getMessage('auth.errors.tooManyRequests', 'Too many attempts were made. Please try again later.')
      case 'auth/network-request-failed':
        return getMessage('auth.errors.network', 'Network error. Check your connection and try again.')
      default:
        return getMessage('auth.errors.generic', 'Authentication failed. Please try again.')
    }
  }

  return getMessage('auth.errors.generic', 'Authentication failed. Please try again.')
}
