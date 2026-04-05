import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore'
import { Badge, Empty, Table, Tag, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import { db } from '../../services/firebase'
import { UserProfile } from '../../types/User'

const { Text } = Typography

export function UserList() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const { t, i18n } = useTranslation()

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const data = snapshot.docs.map((userDoc) => ({
          ...userDoc.data(),
        })) as UserProfile[]

        setUsers(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching users:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const columns = [
    {
      title: t('users.list.user'),
      dataIndex: 'email',
      key: 'email',
      render: (email: string, record: UserProfile) => (
        <div className="space-y-1">
          <Text strong className="text-slate-900">
            {email}
          </Text>
          <div className="text-sm text-slate-500">{t('users.list.uid')}: {record.authUid}</div>
        </div>
      ),
    },
    {
      title: t('users.list.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'purple' : 'blue'} className="capitalize rounded-full px-3 py-1 font-medium">
          {t(`common.roles.${role}`)}
        </Tag>
      ),
    },
    {
      title: t('users.list.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Badge
          status={isActive ? 'success' : 'default'}
          text={isActive ? t('common.states.active') : t('common.states.inactive')}
        />
      ),
    },
    {
      title: t('users.list.created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: Timestamp | null) =>
        createdAt?.toDate
          ? new Intl.DateTimeFormat(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-GB').format(
              createdAt.toDate()
            )
          : 'N/A',
    },
  ]

  return (
    <Table
      className="data-table"
      columns={columns}
      dataSource={users}
      rowKey="authUid"
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
      size="middle"
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('users.list.empty')}
          />
        ),
      }}
    />
  )
}
