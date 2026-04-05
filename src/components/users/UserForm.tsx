import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Form, Input, Switch } from 'antd'
import { useTranslation } from 'react-i18next'

import { createManagedUserAccount, getFirebaseAuthErrorMessage } from '../../services/firebase'
import { SignUpPayload } from '../../types/User'
import { RoleSelector } from './RoleSelector'

export function UserForm() {
  const [form] = Form.useForm<SignUpPayload>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { message } = App.useApp()

  const onFinish = async (values: SignUpPayload) => {
    setLoading(true)
    try {
      await createManagedUserAccount(values)
      message.success(t('users.messages.success'))
      navigate('/users')
    } catch (error: unknown) {
      console.error('Registration error:', error)
      message.error(getFirebaseAuthErrorMessage(error, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ role: 'staff', isActive: true }}
      className="p-6"
    >
      <Form.Item
        label={t('users.form.email')}
        name="email"
        rules={[
          { required: true, message: t('users.form.emailRequired') },
          { type: 'email', message: t('users.form.validEmail') },
        ]}
      >
        <Input size="large" />
      </Form.Item>

      <Form.Item
        label={t('users.form.password')}
        name="password"
        rules={[
          { required: true, message: t('users.form.passwordRequired') },
          { min: 6, message: t('users.form.passwordMin') },
        ]}
      >
        <Input.Password size="large" />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          label={t('users.form.role')}
          name="role"
          rules={[{ required: true, message: t('users.form.roleRequired') }]}
        >
          <RoleSelector size="large" />
        </Form.Item>

        <Form.Item
          label={t('users.form.accountStatus')}
          name="isActive"
          valuePropName="checked"
          tooltip={t('users.form.accountStatusTooltip')}
        >
          <Switch checkedChildren={t('users.form.active')} unCheckedChildren={t('users.form.inactive')} />
        </Form.Item>
      </div>

      <Form.Item className="mb-0 mt-6 text-right">
        <Button size="large" onClick={() => navigate('/users')} className="mr-3">
          {t('users.form.cancel')}
        </Button>
        <Button type="primary" htmlType="submit" size="large" loading={loading}>
          {t('users.form.submit')}
        </Button>
      </Form.Item>
    </Form>
  )
}
