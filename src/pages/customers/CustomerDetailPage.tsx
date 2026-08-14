import { useEffect, useMemo, useState } from 'react'
import { DeleteOutlined, LeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Empty, Grid, Popconfirm, Skeleton, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'

import { CustomerForm, type CustomerFormValues } from '../../components/customers/CustomerForm'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAuth } from '../../hooks/useAuth'
import { useBookings } from '../../hooks/useBookings'
import { db } from '../../services/firebase'
import {
  canDeleteCustomer,
  deleteCustomerWithGuards,
  isDuplicateCustomerPhoneError,
  saveCustomer,
} from '../../services/customerService'
import type { Booking, BookingStatus } from '../../types/Booking'
import type { Customer } from '../../types/Customer'
import { toDate } from '../../utils/date'

const statusColors: Record<BookingStatus, string> = {
  draft: 'default',
  confirmed: 'green',
  'in-progress': 'blue',
  completed: 'purple',
  canceled: 'red',
}

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loadingCustomer, setLoadingCustomer] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { profile } = useAuth()
  const { bookings, loading: bookingsLoading } = useBookings()
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-GB'
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (!id) {
      return
    }

    const unsubscribe = onSnapshot(
      doc(db, 'customers', id),
      (snapshot) => {
        if (!snapshot.exists()) {
          setCustomer(null)
          setLoadingCustomer(false)
          return
        }

        setCustomer({ id: snapshot.id, ...snapshot.data() } as Customer)
        setLoadingCustomer(false)
      },
      (error) => {
        console.error('Error loading customer:', error)
        setLoadingCustomer(false)
      }
    )

    return () => unsubscribe()
  }, [id])

  const customerBookings = useMemo(
    () => bookings.filter((booking) => booking.customerId === id),
    [bookings, id]
  )

  const handleSubmit = async (values: CustomerFormValues) => {
    if (!id) {
      return
    }

    setSaving(true)

    try {
      await saveCustomer(values, id)
      message.success(t('customers.messages.updateSuccess'))
    } catch (error) {
      console.error('Error updating customer:', error)
      message.error(
        isDuplicateCustomerPhoneError(error)
          ? t('customers.form.validation.duplicatePhone')
          : t('customers.messages.updateError')
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!customer) {
      return
    }

    const deleteState = canDeleteCustomer(customer, customerBookings, profile?.role ?? null)

    if (!deleteState.allowed) {
      message.warning(t(deleteState.reasonKey ?? 'customers.messages.deleteError'))
      return
    }

    setDeleting(true)

    try {
      const result = await deleteCustomerWithGuards(customer, profile?.role ?? null)

      if (!result.allowed) {
        message.warning(t(result.reasonKey ?? 'customers.messages.deleteError'))
        return
      }

      message.success(t('customers.messages.deleteSuccess'))
      navigate('/customers')
    } catch (error) {
      console.error('Error deleting customer:', error)
      message.error(t('customers.messages.deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (value: unknown) => {
    const date = toDate(value)

    if (!date) {
      return '—'
    }

    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const columns: ColumnsType<Booking> = [
    {
      title: t('customers.history.booking'),
      dataIndex: 'bookingCode',
      key: 'bookingCode',
      render: (bookingCode: string, record) => (
        <button
          type="button"
          className="cursor-pointer bg-transparent p-0 font-semibold text-teal-700"
          onClick={() => navigate(`/bookings/${record.id}`)}
        >
          {bookingCode}
        </button>
      ),
    },
    {
      title: t('customers.history.car'),
      key: 'car',
      render: (_, record) => record.carSnapshot?.plateNumber || '—',
    },
    {
      title: t('customers.history.dates'),
      key: 'dates',
      render: (_, record) => `${formatDate(record.startDate)} – ${formatDate(record.endDate)}`,
    },
    {
      title: t('customers.history.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: BookingStatus) => (
        <Tag color={statusColors[status]} className="rounded-full px-3 py-1">
          {t(`bookings.status.${status}`)}
        </Tag>
      ),
    },
  ]

  if (loadingCustomer) {
    return (
      <Card className="rounded-[28px] border-0 shadow-sm p-6">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (!customer) {
    return (
      <Card className="rounded-[28px] border-0 shadow-sm p-6">
        <Empty description={t('customers.messages.notFound')} />
      </Card>
    )
  }

  const deleteState = canDeleteCustomer(customer, customerBookings, profile?.role ?? null)
  const deleteButton = (
    <Button
      icon={<DeleteOutlined />}
      danger
      loading={deleting}
      disabled={!deleteState.allowed}
      aria-label={t('common.actions.delete')}
    >
      {!isMobile ? t('common.actions.delete') : undefined}
    </Button>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center space-x-4">
          <Button icon={<LeftOutlined />} type="text" onClick={() => navigate('/customers')}>
            {!isMobile && t('customers.form.back')}
          </Button>
          <Typography.Title level={isMobile ? 4 : 2} className="!mb-0 !mt-0 truncate text-slate-900">
            {customer.fullName}
          </Typography.Title>
        </div>
        {isAdmin ? (
          deleteState.allowed ? (
            <Popconfirm
              title={t('customers.messages.deleteTitle')}
              description={t('customers.messages.deleteDescription', { name: customer.fullName })}
              onConfirm={() => void handleDelete()}
              okText={t('common.actions.delete')}
              cancelText={t('common.actions.cancel')}
              okButtonProps={{ danger: true }}
            >
              {deleteButton}
            </Popconfirm>
          ) : (
            <Tooltip title={t(deleteState.reasonKey ?? 'customers.messages.deleteError')}>
              <span>{deleteButton}</span>
            </Tooltip>
          )
        ) : null}
      </div>

      <Card className="rounded-[28px] border-0 shadow-sm">
        <CustomerForm
          key={customer.id}
          initialValues={customer}
          onSubmit={handleSubmit}
          isLoading={saving}
          submitLabel={t('customers.form.submitUpdate')}
        />
      </Card>

      <SectionCard
        title={t('customers.history.title')}
        description={t('customers.history.description')}
      >
        {bookingsLoading ? (
          <div className="p-6">
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        ) : customerBookings.length ? (
          <Table
            className="data-table"
            columns={columns}
            dataSource={customerBookings}
            rowKey="id"
            pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
          />
        ) : (
          <div className="px-4 py-8">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('customers.history.empty')} />
          </div>
        )}
      </SectionCard>
    </div>
  )
}
