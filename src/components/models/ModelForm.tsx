import { useEffect } from 'react'
import { Button, Form, Input, Switch } from 'antd'
import { useTranslation } from 'react-i18next'

import { BrandSelector } from '../cars/BrandSelector'
import { CarModel } from '../../types/Model'

export interface ModelFormValues {
  brandId: string
  name: string
  isActive: boolean
}

interface ModelFormProps {
  initialValues?: Partial<CarModel>
  onSubmit: (values: ModelFormValues) => void
  isLoading?: boolean
}

export function ModelForm({ initialValues, onSubmit, isLoading = false }: ModelFormProps) {
  const [form] = Form.useForm<ModelFormValues>()
  const { t } = useTranslation()

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        brandId: initialValues.brandId,
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
        name="brandId"
        label={t('models.form.brand')}
        rules={[{ required: true, message: t('models.form.brandRequired') }]}
      >
        <BrandSelector includeInactive />
      </Form.Item>

      <Form.Item
        name="name"
        label={t('models.form.name')}
        rules={[{ required: true, message: t('models.form.nameRequired') }]}
      >
        <Input placeholder={t('models.form.placeholder')} />
      </Form.Item>

      <Form.Item name="isActive" label={t('models.form.available')} valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item className="mb-0">
        <Button type="primary" htmlType="submit" loading={isLoading}>
          {initialValues?.id ? t('models.form.submitUpdate') : t('models.form.submitCreate')}
        </Button>
      </Form.Item>
    </Form>
  )
}
