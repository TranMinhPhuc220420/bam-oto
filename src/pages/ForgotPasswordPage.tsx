import { Alert, Button, Form, Input, Typography, message } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { AuthPageShell } from '../components/auth/AuthPageShell'
import { useAuth } from '../hooks/useAuth'
import { getFirebaseAuthErrorMessage } from '../services/firebase'

interface ForgotPasswordFormValues {
  email: string
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { t } = useTranslation()
  const [form] = Form.useForm<ForgotPasswordFormValues>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  async function handleSubmit(values: ForgotPasswordFormValues) {
    try {
      setIsSubmitting(true)
      await resetPassword(values.email)
      messageApi.success(t('auth.forgotPassword.success'))
      form.resetFields()
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
        title={t('auth.forgotPassword.title')}
        subtitle={t('auth.forgotPassword.subtitle')}
      >
        <Alert
          className="mb-6 rounded-2xl"
          type="info"
          showIcon
          message={t('auth.forgotPassword.info')}
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item
            label={t('auth.forgotPassword.email')}
            name="email"
            rules={[
              { required: true, message: t('auth.validation.emailRequired') },
              { type: 'email', message: t('auth.validation.emailInvalid') },
            ]}
          >
            <Input placeholder={t('auth.forgotPassword.emailPlaceholder')} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={isSubmitting} className="h-12">
            {t('auth.forgotPassword.submit')}
          </Button>
        </Form>

        <div className="mt-6 text-sm text-slate-600">
          <Typography.Text className="text-slate-500">
            {t('auth.forgotPassword.remembered')}
          </Typography.Text>{' '}
          <Link to="/login">{t('auth.forgotPassword.backToSignIn')}</Link>
        </div>
      </AuthPageShell>
    </>
  )
}
