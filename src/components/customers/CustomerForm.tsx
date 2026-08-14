import { Button, Form, Input, Switch } from 'antd'
import { useTranslation } from 'react-i18next'

import { useCustomers } from '../../hooks/useCustomers'
import type { Customer } from '../../types/Customer'
import {
  driverLicenseRule,
  duplicatePhoneRule,
  emailRule,
  formScrollToFirstError,
  formValidateTrigger,
  governmentIdRule,
  requiredTrimmed,
  vnPhoneRule,
} from '../../utils/validation'

export interface CustomerFormValues {
  fullName: string
  phoneNumber: string
  email?: string
  governmentId?: string
  driverLicenseNumber?: string
  notes?: string
  isActive: boolean
}

interface CustomerFormProps {
  initialValues?: Partial<Customer>
  onSubmit: (values: CustomerFormValues) => Promise<void> | void
  isLoading?: boolean
  submitLabel: string
}

export function CustomerForm({ initialValues, onSubmit, isLoading = false, submitLabel }: CustomerFormProps) {
  const [form] = Form.useForm<CustomerFormValues>()
  const { t } = useTranslation()
  const { customers } = useCustomers({ includeInactive: true })

  return (
    <Form
      form={form}
      layout="vertical"
      className="p-4 sm:p-6"
      validateTrigger={[...formValidateTrigger]}
      scrollToFirstError={formScrollToFirstError}
      initialValues={{
        fullName: initialValues?.fullName,
        phoneNumber: initialValues?.phoneNumber,
        email: initialValues?.email,
        governmentId: initialValues?.governmentId,
        driverLicenseNumber: initialValues?.driverLicenseNumber,
        notes: initialValues?.notes,
        isActive: initialValues?.isActive ?? true,
      }}
      onFinish={onSubmit}
    >
      <Form.Item
        label={t('customers.form.fullName')}
        name="fullName"
        rules={[requiredTrimmed(t('customers.form.validation.fullName'))]}
      >
        <Input size="large" placeholder={t('customers.form.fullNamePlaceholder')} />
      </Form.Item>

      <Form.Item
        label={t('customers.form.phoneNumber')}
        name="phoneNumber"
        validateFirst
        rules={[
          vnPhoneRule({
            requiredMessage: t('customers.form.validation.phoneNumber'),
            formatMessage: t('common.validation.phoneFormat'),
          }),
          duplicatePhoneRule(t('customers.form.validation.duplicatePhone'), () => customers, {
            getCurrentId: () => initialValues?.id,
          }),
        ]}
      >
        <Input size="large" inputMode="tel" autoComplete="tel" placeholder={t('customers.form.phoneNumberPlaceholder')} />
      </Form.Item>

      <Form.Item label={t('customers.form.email')} name="email" rules={[emailRule(t('common.validation.emailFormat'))]}>
        <Input size="large" inputMode="email" autoComplete="email" placeholder={t('customers.form.emailPlaceholder')} />
      </Form.Item>

      <div className="grid gap-4 sm:grid-cols-2">
        <Form.Item
          label={t('customers.form.governmentId')}
          name="governmentId"
          rules={[governmentIdRule(t('common.validation.governmentId'))]}
        >
          <Input size="large" inputMode="numeric" placeholder={t('customers.form.governmentIdPlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('customers.form.driverLicenseNumber')}
          name="driverLicenseNumber"
          rules={[driverLicenseRule(t('common.validation.driverLicense'))]}
        >
          <Input size="large" placeholder={t('customers.form.driverLicensePlaceholder')} />
        </Form.Item>
      </div>

      <Form.Item label={t('customers.form.notes')} name="notes">
        <Input.TextArea rows={3} placeholder={t('customers.form.notesPlaceholder')} />
      </Form.Item>

      <Form.Item
        label={t('customers.form.accountStatus')}
        name="isActive"
        valuePropName="checked"
      >
        <Switch checkedChildren={t('common.states.active')} unCheckedChildren={t('common.states.inactive')} />
      </Form.Item>

      <Form.Item className="mb-0 text-right">
        <Button type="primary" htmlType="submit" size="large" loading={isLoading} className="rounded-full px-6">
          {submitLabel}
        </Button>
      </Form.Item>
    </Form>
  )
}
