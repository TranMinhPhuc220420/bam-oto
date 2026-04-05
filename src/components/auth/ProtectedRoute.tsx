import { Alert, Button, Result, Spin } from 'antd'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  requireAdmin?: boolean
}

export function ProtectedRoute({ requireAdmin = false }: ProtectedRouteProps) {
  const { currentUser, loading, profile, signOut } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950/5">
        <Spin size="large" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Alert
          className="max-w-xl"
          title="Missing user profile"
          description="A Firestore user document was not found for this account. Create users/{authUid} with role and isActive fields before granting access."
          type="warning"
          showIcon
        />
      </div>
    )
  }

  if (!profile.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Result
          status="403"
          title="Account disabled"
          subTitle="This account is inactive. Contact an administrator to restore access."
          extra={
            <Button type="primary" onClick={() => void signOut()}>
              Sign out
            </Button>
          }
        />
      </div>
    )
  }

  if (requireAdmin && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
