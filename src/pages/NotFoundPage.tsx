import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <Result
        status="404"
        title="Page not found"
        subTitle="The requested route does not exist in the fleet console."
        extra={
          <Button type="primary" onClick={() => navigate(currentUser ? '/dashboard' : '/login')}>
            Return to workspace
          </Button>
        }
      />
    </div>
  )
}
