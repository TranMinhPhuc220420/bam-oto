import { Link } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useTranslation } from 'react-i18next'

import { UserList } from '../../components/users/UserList'
import { SectionCard } from '../../components/ui/SectionCard'

export function UsersPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <SectionCard
        title={t('users.page.directoryTitle')}
        actions={
          <Link to="/users/new">
            <Button type="primary" icon={<PlusOutlined />} className="rounded-full px-6">
              {t('users.page.create')}
            </Button>
          </Link>
        }
      >
        <UserList />
      </SectionCard>
    </div>
  )
}
