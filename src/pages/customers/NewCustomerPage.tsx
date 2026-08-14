import { useState } from 'react'
import { LeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Grid } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { CustomerForm, type CustomerFormValues } from '../../components/customers/CustomerForm'
import { isDuplicateCustomerPhoneError, saveCustomer } from '../../services/customerService'

export function NewCustomerPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: CustomerFormValues) => {
    setLoading(true)

    try {
      await saveCustomer(values)
      message.success(t('customers.messages.createSuccess'))
      navigate('/customers')
    } catch (error) {
      console.error('Error creating customer:', error)
      message.error(
        isDuplicateCustomerPhoneError(error)
          ? t('customers.form.validation.duplicatePhone')
          : t('customers.messages.createError')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center space-x-4 sm:mb-6">
        <Button icon={<LeftOutlined />} type="text" onClick={() => navigate('/customers')}>
          {!isMobile && t('customers.form.back')}
        </Button>
      </div>

      <Card className="rounded-[28px] border-0 shadow-sm">
        <CustomerForm onSubmit={handleSubmit} isLoading={loading} submitLabel={t('customers.form.submitCreate')} />
      </Card>
    </div>
  )
}
