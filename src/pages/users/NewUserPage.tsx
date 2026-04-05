import { Link } from 'react-router-dom'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import { UserForm } from '../../components/users/UserForm'

const { Title } = Typography

export function NewUserPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/users">
          <Button icon={<ArrowLeftOutlined />} shape="circle" type="text" />
        </Link>
        <Title level={3} className="!m-0">
          {t('users.page.newTitle')}
        </Title>
      </div>

      <Card className="rounded-xl border shadow-sm">
        <UserForm />
      </Card>
    </div>
  )
}
