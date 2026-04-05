import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore'
import { Badge, Empty, Grid, Skeleton, Table, Tag, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import { db } from '../../services/firebase'
import { UserProfile } from '../../types/User'

const { Text } = Typography

export function UserList() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const { t, i18n } = useTranslation()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false

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

  const formatCreatedAt = (createdAt: Timestamp | null | undefined) =>
    createdAt?.toDate
      ? new Intl.DateTimeFormat(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-GB').format(createdAt.toDate())
      : 'N/A'

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
      render: (createdAt: Timestamp | null) => formatCreatedAt(createdAt),
    },
  ]

  if (isMobile) {
    if (loading) {
      return (
        <div className="mobile-card-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`user-skeleton-${index}`}
              className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
            >
              <Skeleton active paragraph={{ rows: 3 }} title={{ width: '45%' }} />
            </div>
          ))}
        </div>
      )
    }

    if (!users.length) {
      return (
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('users.list.empty')} />
        </div>
      )
    }

    return (
      <div className="mobile-card-list">
        {users.map((user) => (
          <article
            key={user.authUid}
            className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <Text strong className="mobile-clamp-2 text-slate-900">
                  {user.email}
                </Text>
                <div className="mobile-clamp-1 text-xs text-slate-500">
                  {t('users.list.uid')}: {user.authUid}
                </div>
              </div>

              <Tag color={user.role === 'admin' ? 'purple' : 'blue'} className="m-0 rounded-full px-3 py-1 font-medium">
                {t(`common.roles.${user.role}`)}
              </Tag>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {t('users.list.status')}
                </div>
                <Badge
                  status={user.isActive ? 'success' : 'default'}
                  text={user.isActive ? t('common.states.active') : t('common.states.inactive')}
                />
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {t('users.list.created')}
                </div>
                <div className="text-sm text-slate-700">{formatCreatedAt((user.createdAt as Timestamp | null | undefined) ?? null)}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    )
  }

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
