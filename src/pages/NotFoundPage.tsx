import { Button, Result } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <Result
        status="404"
        title={t('notFound.title')}
        subTitle={t('notFound.subtitle')}
        extra={
          <Button type="primary" onClick={() => navigate(currentUser ? '/dashboard' : '/login')}>
            {currentUser ? t('notFound.action') : t('notFound.actionLogin')}
          </Button>
        }
      />
    </div>
  )
}
