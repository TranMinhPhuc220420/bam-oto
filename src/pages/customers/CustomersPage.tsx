import { useState } from 'react'
import { PlusOutlined, TeamOutlined } from '@ant-design/icons'
import { App, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { CustomerList } from '../../components/customers/CustomerList'
import { MetricCard } from '../../components/ui/MetricCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAuth } from '../../hooks/useAuth'
import { useBookings } from '../../hooks/useBookings'
import { useCustomers } from '../../hooks/useCustomers'
import { canDeleteCustomer, deleteCustomerWithGuards } from '../../services/customerService'
import type { Customer } from '../../types/Customer'

export function CustomersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { profile } = useAuth()
  const { customers, loading } = useCustomers({ includeInactive: true })
  const { bookings } = useBookings()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const isAdmin = profile?.role === 'admin'
  const activeCount = customers.filter((customer) => customer.isActive !== false).length

  const getDeleteState = (customer: Customer) =>
    canDeleteCustomer(
      customer,
      bookings.filter((booking) => booking.customerId === customer.id),
      profile?.role ?? null,
    )

  const handleDelete = async (customer: Customer) => {
    const deleteState = getDeleteState(customer)

    if (!deleteState.allowed) {
      message.warning(t(deleteState.reasonKey ?? 'customers.messages.deleteError'))
      return
    }

    setDeletingId(customer.id ?? null)

    try {
      const result = await deleteCustomerWithGuards(customer, profile?.role ?? null)

      if (!result.allowed) {
        message.warning(t(result.reasonKey ?? 'customers.messages.deleteError'))
        return
      }

      message.success(t('customers.messages.deleteSuccess'))
    } catch (error) {
      console.error('Error deleting customer:', error)
      message.error(t('customers.messages.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label={t('customers.metrics.total')}
          value={customers.length}
          hint={t('customers.metrics.totalHint')}
          icon={<TeamOutlined />}
        />
        <MetricCard
          label={t('customers.metrics.active')}
          value={activeCount}
          hint={t('customers.metrics.activeHint')}
          icon={<TeamOutlined />}
        />
      </div>

      <SectionCard
        title={t('customers.page.directoryTitle')}
        description={t('customers.page.directoryDescription')}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/customers/new')}
            className="rounded-full px-6"
          >
            {t('customers.page.create')}
          </Button>
        }
      >
        <CustomerList
          customers={customers}
          isLoading={loading}
          onDelete={isAdmin ? handleDelete : undefined}
          deletingId={deletingId}
          getDeleteState={isAdmin ? getDeleteState : undefined}
        />
      </SectionCard>
    </div>
  )
}
