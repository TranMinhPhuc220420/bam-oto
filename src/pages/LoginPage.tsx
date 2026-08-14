import { useState } from 'react'
import { Button, Form, Input, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthPageShell } from '../components/auth/AuthPageShell'
import { useAuth } from '../hooks/useAuth'
import { getFirebaseAuthErrorMessage } from '../services/firebase'
import {
  emailRule,
  formScrollToFirstError,
  formValidateTrigger,
  normalizeEmail,
  requiredTrimmed,
} from '../utils/validation'

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
      : '/dashboard'

  async function handleSubmit(values: LoginFormValues) {
    try {
      setIsSubmitting(true)
      const credential = await signIn(normalizeEmail(values.email), values.password)

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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          validateTrigger={[...formValidateTrigger]}
          scrollToFirstError={formScrollToFirstError}
        >
          <Form.Item
            label={t('auth.login.email')}
            name="email"
            rules={[requiredTrimmed(t('auth.validation.emailRequired')), emailRule(t('auth.validation.emailInvalid'))]}
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

        <div className="mt-6 text-center text-sm text-slate-600">
          <Link to="/forgot-password">{t('auth.login.forgotPassword')}</Link>
        </div>
      </AuthPageShell>
    </>
  )
}
