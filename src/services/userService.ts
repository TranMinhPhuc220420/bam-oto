import { deleteDoc, doc } from 'firebase/firestore'

import { db } from './firebase'
import type { UserProfile, UserRole } from '../types/User'

export interface UserDeleteEligibilityResult {
  allowed: boolean
  reasonKey?: string
}

export function canDeleteUser(
  user: Pick<UserProfile, 'authUid' | 'role'>,
  options: {
    currentUid?: string | null
    role?: UserRole | null
    adminCount: number
  },
): UserDeleteEligibilityResult {
  if (options.role !== 'admin') {
    return { allowed: false, reasonKey: 'users.messages.deleteError' }
  }

  if (!user.authUid) {
    return { allowed: false, reasonKey: 'users.messages.deleteError' }
  }

  if (user.authUid === options.currentUid) {
    return { allowed: false, reasonKey: 'users.messages.cannotDeleteSelf' }
  }

  if (user.role === 'admin' && options.adminCount <= 1) {
    return { allowed: false, reasonKey: 'users.messages.cannotDeleteLastAdmin' }
  }

  return { allowed: true }
}

export async function deleteUserWithGuards(
  user: Pick<UserProfile, 'authUid' | 'role'>,
  options: {
    currentUid?: string | null
    role?: UserRole | null
    adminCount: number
  },
): Promise<UserDeleteEligibilityResult> {
  const eligibility = canDeleteUser(user, options)

  if (!eligibility.allowed || !user.authUid) {
    return eligibility.allowed ? { allowed: false, reasonKey: 'users.messages.deleteError' } : eligibility
  }

  await deleteDoc(doc(db, 'users', user.authUid))

  return { allowed: true }
}
