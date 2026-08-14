import { Alert, Button, Result, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  requireAdmin?: boolean
}

export function ProtectedRoute({ requireAdmin = false }: ProtectedRouteProps) {
  const { currentUser, loading, profile, signOut } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

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
          title={t('auth.protected.missingProfile.title')}
          description={t('auth.protected.missingProfile.description')}
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
          title={t('auth.protected.disabled.title')}
          subTitle={t('auth.protected.disabled.subtitle')}
          extra={
            <Button type="primary" onClick={() => void signOut()}>
              {t('common.actions.signOut')}
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
