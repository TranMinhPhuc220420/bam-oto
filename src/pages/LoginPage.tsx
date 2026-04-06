import { useState } from 'react'
import { Alert, Button, Form, Input, Typography, Grid, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthPageShell } from '../components/auth/AuthPageShell'
import { useAuth } from '../hooks/useAuth'
import { getFirebaseAuthErrorMessage } from '../services/firebase'

interface LoginFormValues {
  email: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const { t } = useTranslation()
  const [form] = Form.useForm<LoginFormValues>()
  const [messageApi, contextHolder] = message.useMessage()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fromPath =
    typeof location.state === 'object' &&
      location.state !== null &&
      'from' in location.state &&
      typeof location.state.from === 'object' &&
      location.state.from !== null &&
      'pathname' in location.state.from &&
      typeof location.state.from.pathname === 'string'
      ? location.state.from.pathname
      : '/cars'

  async function handleSubmit(values: LoginFormValues) {
    try {
      setIsSubmitting(true)
      const credential = await signIn(values.email, values.password)

      if (!credential.user.emailVerified) {
        messageApi.warning(t('auth.login.unverifiedWarning'))
      }

      navigate(fromPath, { replace: true })
    } catch (error) {
      messageApi.error(getFirebaseAuthErrorMessage(error, t))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {contextHolder}
      <AuthPageShell
        title={t('auth.login.title')}
        subtitle={t('auth.login.subtitle')}
      >
        {/* <Alert
          className="mb-6 rounded-2xl"
          type="info"
          showIcon
          message={t('auth.login.info')}
        /> */}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={t('auth.login.email')}
            name="email"
            rules={[
              { required: true, message: t('auth.validation.emailRequired') },
              { type: 'email', message: t('auth.validation.emailInvalid') },
            ]}
          >
            <Input placeholder={t('auth.login.emailPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('auth.login.password')}
            name="password"
            rules={[{ required: true, message: t('auth.validation.passwordRequired') }]}
          >
            <Input.Password placeholder={t('auth.login.passwordPlaceholder')} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={isSubmitting} className="h-12">
            {t('auth.login.submit')}
          </Button>
        </Form>

        <div className="mt-6 text-sm text-slate-600 text-center">
          <Link to="/forgot-password">{t('auth.login.forgotPassword')}</Link>
          {/* <Typography.Text className="text-slate-500">
            {t('auth.login.adminHint')}
          </Typography.Text> */}
        </div>
      </AuthPageShell>
    </>
  )
}
