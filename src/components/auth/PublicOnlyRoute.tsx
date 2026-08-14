import { Spin } from 'antd'
import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

export function PublicOnlyRoute() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950/5">
        <Spin size="large" />
      </div>
    )
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
