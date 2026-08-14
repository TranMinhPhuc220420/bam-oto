import { useEffect, useState } from 'react'
import { DeleteOutlined } from '@ant-design/icons'
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore'
import { App, Badge, Button, Empty, Grid, Popconfirm, Skeleton, Switch, Table, Tag, Tooltip, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../hooks/useAuth'
import { db } from '../../services/firebase'
import { canDeleteUser, deleteUserWithGuards } from '../../services/userService'
import { UserProfile } from '../../types/User'
import { EmptyCopy } from '../ui/EmptyCopy'

const { Text } = Typography

export function UserList() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUid, setUpdatingUid] = useState<string | null>(null)
  const [deletingUid, setDeletingUid] = useState<string | null>(null)
  const { currentUser, profile } = useAuth()
  const { t, i18n } = useTranslation()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const adminCount = users.filter((member) => member.role === 'admin').length

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

  const handleToggleActive = async (user: UserProfile, nextActive: boolean) => {
    if (user.authUid === currentUser?.uid) {
      message.warning(t('users.messages.cannotDeactivateSelf'))
      return
    }

    setUpdatingUid(user.authUid)

    try {
      await updateDoc(doc(db, 'users', user.authUid), {
        isActive: nextActive,
        updatedAt: serverTimestamp(),
      })
      message.success(t(nextActive ? 'users.messages.activateSuccess' : 'users.messages.deactivateSuccess'))
    } catch (error) {
      console.error('Error updating user status:', error)
      message.error(t('users.messages.updateError'))
    } finally {
      setUpdatingUid(null)
    }
  }

  const handleDelete = async (user: UserProfile) => {
    const deleteState = canDeleteUser(user, {
      currentUid: currentUser?.uid,
      role: profile?.role ?? null,
      adminCount,
    })

    if (!deleteState.allowed) {
      message.warning(t(deleteState.reasonKey ?? 'users.messages.deleteError'))
      return
    }

    setDeletingUid(user.authUid)

    try {
      const result = await deleteUserWithGuards(user, {
        currentUid: currentUser?.uid,
        role: profile?.role ?? null,
        adminCount,
      })

      if (!result.allowed) {
        message.error(t(result.reasonKey ?? 'users.messages.deleteError'))
        return
      }

      message.success(t('users.messages.deleteSuccess'))
    } catch (error) {
      console.error('Error deleting user:', error)
      message.error(t('users.messages.deleteError'))
    } finally {
      setDeletingUid(null)
    }
  }

  const renderStatusControl = (user: UserProfile) => {
    const isCurrentUser = user.authUid === currentUser?.uid

    return (
      <Tooltip title={isCurrentUser ? t('users.messages.cannotDeactivateSelf') : undefined}>
        <div className="flex items-center gap-2">
          <Switch
            checked={user.isActive}
            disabled={isCurrentUser}
            loading={updatingUid === user.authUid}
            onChange={(checked) => void handleToggleActive(user, checked)}
            checkedChildren={t('users.form.active')}
            unCheckedChildren={t('users.form.inactive')}
          />
          <Badge
            status={user.isActive ? 'success' : 'default'}
            text={user.isActive ? t('common.states.active') : t('common.states.inactive')}
          />
        </div>
      </Tooltip>
    )
  }

  const renderDeleteControl = (user: UserProfile) => {
    const deleteState = canDeleteUser(user, {
      currentUid: currentUser?.uid,
      role: profile?.role ?? null,
      adminCount,
    })
    const button = (
      <Button
        icon={<DeleteOutlined />}
        size="small"
        danger
        shape="circle"
        disabled={!deleteState.allowed}
        loading={deletingUid === user.authUid}
        aria-label={t('common.actions.delete')}
      />
    )

    if (!deleteState.allowed) {
      return (
        <Tooltip title={t(deleteState.reasonKey ?? 'users.messages.deleteError')}>
          <span>{button}</span>
        </Tooltip>
      )
    }

    return (
      <Popconfirm
        title={t('users.messages.deleteTitle')}
        description={t('users.messages.deleteDescription', { email: user.email })}
        onConfirm={() => void handleDelete(user)}
        okText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        okButtonProps={{ danger: true }}
      >
        {button}
      </Popconfirm>
    )
  }

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
      render: (_isActive: boolean, record: UserProfile) => renderStatusControl(record),
    },
    {
      title: t('users.list.created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: Timestamp | null) => formatCreatedAt(createdAt),
    },
    {
      title: t('users.list.actions'),
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, record: UserProfile) => renderDeleteControl(record),
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
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<EmptyCopy title={t('users.list.empty')} hint={t('users.list.emptyHint')} />} />
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

              <div className="flex shrink-0 items-center gap-2">
                <Tag color={user.role === 'admin' ? 'purple' : 'blue'} className="m-0 rounded-full px-3 py-1 font-medium">
                  {t(`common.roles.${user.role}`)}
                </Tag>
                {renderDeleteControl(user)}
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {t('users.list.status')}
                </div>
                {renderStatusControl(user)}
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
            description={<EmptyCopy title={t('users.list.empty')} hint={t('users.list.emptyHint')} />}
          />
        ),
      }}
    />
  )
}
