import { DeleteOutlined, EditOutlined, PhoneOutlined } from '@ant-design/icons'
import { Button, Empty, Grid, Popconfirm, Skeleton, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { CustomerDeleteEligibilityResult } from '../../services/customerService'
import type { Customer } from '../../types/Customer'
import { EmptyCopy } from '../ui/EmptyCopy'

interface CustomerListProps {
  customers: Customer[]
  isLoading: boolean
  onDelete?: (customer: Customer) => void
  deletingId?: string | null
  getDeleteState?: (customer: Customer) => CustomerDeleteEligibilityResult
}

export function CustomerList({
  customers,
  isLoading,
  onDelete,
  deletingId,
  getDeleteState,
}: CustomerListProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false

  const renderDeleteControl = (customer: Customer) => {
    if (!onDelete) {
      return null
    }

    const deleteState = getDeleteState?.(customer) ?? { allowed: true }
    const button = (
      <Button
        icon={<DeleteOutlined />}
        size="small"
        danger
        shape="circle"
        disabled={!deleteState.allowed}
        loading={Boolean(customer.id && deletingId === customer.id)}
        aria-label={t('common.actions.delete')}
      />
    )

    if (!deleteState.allowed) {
      return (
        <Tooltip title={t(deleteState.reasonKey ?? 'customers.messages.deleteError')}>
          <span>{button}</span>
        </Tooltip>
      )
    }

    return (
      <Popconfirm
        title={t('customers.messages.deleteTitle')}
        description={t('customers.messages.deleteDescription', { name: customer.fullName })}
        onConfirm={() => onDelete(customer)}
        okText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        okButtonProps={{ danger: true }}
      >
        {button}
      </Popconfirm>
    )
  }

  const columns: ColumnsType<Customer> = [
    {
      title: t('customers.list.customer'),
      key: 'customer',
      render: (_, record) => (
        <div className="space-y-1">
          <button
            type="button"
            className="cursor-pointer bg-transparent p-0 text-left text-sm font-semibold text-slate-900 transition hover:text-teal-700"
            onClick={() => navigate(`/customers/${record.id}`)}
          >
            {record.fullName}
          </button>
          <div className="text-sm text-slate-500">{record.phoneNumber}</div>
        </div>
      ),
    },
    {
      title: t('customers.list.email'),
      dataIndex: 'email',
      key: 'email',
      render: (email?: string) => email || '—',
    },
    {
      title: t('customers.list.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive !== false ? 'green' : 'default'} className="rounded-full px-3 py-1">
          {isActive !== false ? t('common.states.active') : t('common.states.inactive')}
        </Tag>
      ),
    },
    {
      title: t('customers.list.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.actions.edit')}>
            <Button
              icon={<EditOutlined />}
              size="small"
              shape="circle"
              aria-label={t('common.actions.edit')}
              onClick={() => navigate(`/customers/${record.id}`)}
            />
          </Tooltip>
          {renderDeleteControl(record)}
        </Space>
      ),
    },
  ]

  if (isMobile) {
    if (isLoading) {
      return (
        <div className="mobile-card-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`customer-skeleton-${index}`}
              className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
            >
              <Skeleton active paragraph={{ rows: 2 }} title={{ width: '50%' }} />
            </div>
          ))}
        </div>
      )
    }

    if (!customers.length) {
      return (
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<EmptyCopy title={t('customers.list.empty')} hint={t('customers.list.emptyHint')} />} />
        </div>
      )
    }

    return (
      <div className="mobile-card-list">
        {customers.map((customer) => (
          <article
            key={customer.id}
            className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                className="min-w-0 cursor-pointer bg-transparent p-0 text-left"
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <Typography.Text strong className="mobile-clamp-2 text-slate-900">
                  {customer.fullName}
                </Typography.Text>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                  <PhoneOutlined />
                  <span>{customer.phoneNumber}</span>
                </div>
              </button>
              <div className="flex shrink-0 items-start gap-2">
                <Tag color={customer.isActive !== false ? 'green' : 'default'} className="m-0 rounded-full px-3 py-1">
                  {customer.isActive !== false ? t('common.states.active') : t('common.states.inactive')}
                </Tag>
                {renderDeleteControl(customer)}
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
      dataSource={customers}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
      locale={{
        emptyText: (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<EmptyCopy title={t('customers.list.empty')} hint={t('customers.list.emptyHint')} />} />
        ),
      }}
    />
  )
}
