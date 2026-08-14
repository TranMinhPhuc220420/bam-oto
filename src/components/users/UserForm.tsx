import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Form, Input, Switch } from 'antd'
import { useTranslation } from 'react-i18next'

import { createManagedUserAccount, getFirebaseAuthErrorMessage } from '../../services/firebase'
import { SignUpPayload } from '../../types/User'
import { emailRule, formScrollToFirstError, formValidateTrigger, normalizeEmail, requiredTrimmed } from '../../utils/validation'
import { RoleSelector } from './RoleSelector'

type UserFormValues = SignUpPayload & {
  passwordConfirm: string
}

export function UserForm() {
  const [form] = Form.useForm<UserFormValues>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { message } = App.useApp()

  const onFinish = async (values: UserFormValues) => {
    const { passwordConfirm: _passwordConfirm, ...payload } = values
    setLoading(true)
    try {
      await createManagedUserAccount({
        ...payload,
        email: normalizeEmail(payload.email),
      })
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
      validateTrigger={[...formValidateTrigger]}
      scrollToFirstError={formScrollToFirstError}
      className="p-6"
    >
      <Form.Item
        label={t('users.form.email')}
        name="email"
        rules={[requiredTrimmed(t('users.form.emailRequired')), emailRule(t('users.form.validEmail'))]}
      >
        <Input size="large" inputMode="email" autoComplete="email" />
      </Form.Item>

      <Form.Item
        label={t('users.form.password')}
        name="password"
        rules={[
          { required: true, message: t('users.form.passwordRequired') },
          { min: 6, message: t('users.form.passwordMin') },
        ]}
      >
        <Input.Password size="large" autoComplete="new-password" />
      </Form.Item>

      <Form.Item
        label={t('users.form.passwordConfirm')}
        name="passwordConfirm"
        dependencies={['password']}
        rules={[
          { required: true, message: t('users.form.passwordConfirmRequired') },
          ({ getFieldValue }) => ({
            validator(_, value: string | undefined) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
              }

              return Promise.reject(new Error(t('users.form.passwordMismatch')))
            },
          }),
        ]}
      >
        <Input.Password size="large" autoComplete="new-password" />
      </Form.Item>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <Button size="large" onClick={() => navigate('/users')} className="mr-3 rounded-full">
          {t('users.form.cancel')}
        </Button>
        <Button type="primary" htmlType="submit" size="large" loading={loading} className="rounded-full px-6">
          {t('users.form.submit')}
        </Button>
      </Form.Item>
    </Form>
  )
}
