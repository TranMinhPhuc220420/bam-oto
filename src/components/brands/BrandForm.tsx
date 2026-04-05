import { useEffect } from 'react'
import { Button, Form, Input, Switch } from 'antd'
import { useTranslation } from 'react-i18next'

import { CarBrand } from '../../types/Brand'

export interface BrandFormValues {
  name: string
  isActive: boolean
}

interface BrandFormProps {
  initialValues?: Partial<CarBrand>
  onSubmit: (values: BrandFormValues) => void
  isLoading?: boolean
}

export function BrandForm({ initialValues, onSubmit, isLoading = false }: BrandFormProps) {
  const [form] = Form.useForm<BrandFormValues>()
  const { t } = useTranslation()

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        name: initialValues.name,
        isActive: initialValues.isActive ?? true,
      })
    }
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ isActive: true, ...initialValues }}
      onFinish={(values) => onSubmit({ ...values, name: values.name.trim() })}
    >
      <Form.Item
        name="name"
        label={t('brands.form.name')}
        rules={[{ required: true, message: t('brands.form.required') }]}
      >
        <Input placeholder={t('brands.form.placeholder')} />
      </Form.Item>

      <Form.Item name="isActive" label={t('brands.form.available')} valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item className="mb-0">
        <Button type="primary" htmlType="submit" loading={isLoading}>
          {initialValues?.id ? t('brands.form.submitUpdate') : t('brands.form.submitCreate')}
        </Button>
      </Form.Item>
    </Form>
  )
}
