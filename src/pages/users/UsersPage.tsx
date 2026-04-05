import { Link } from 'react-router-dom'
import { PlusOutlined, SafetyCertificateOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useTranslation } from 'react-i18next'

import { UserList } from '../../components/users/UserList'
import { SectionCard } from '../../components/ui/SectionCard'

export function UsersPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.35)] sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="mb-0 text-[11px] font-semibold uppercase tracking-[0.26em] text-teal-700">
            {t('users.page.eyebrow')}
          </p>
          <h2 className="mb-0 text-2xl font-semibold text-slate-900">{t('users.page.title')}</h2>
          <p className="mb-0 max-w-3xl text-sm text-slate-600 sm:text-base">
            {t('users.page.description')}
          </p>
        </div>

        <Link to="/users/new">
          <Button type="primary" icon={<PlusOutlined />} size="large" className="rounded-full px-6 sm:self-start">
            {t('users.page.create')}
          </Button>
        </Link>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.45)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="mb-0 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Role control</p>
            <SafetyCertificateOutlined className="text-lg text-teal-700" />
          </div>
          <p className="mb-0 text-sm text-slate-600">Assign the right access level before new users enter daily workflows.</p>
        </div>
        <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.45)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="mb-0 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Team visibility</p>
            <TeamOutlined className="text-lg text-teal-700" />
          </div>
          <p className="mb-0 text-sm text-slate-600">Review all accounts, roles, and account status from one structured table.</p>
        </div>
        <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.45)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="mb-0 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Fast onboarding</p>
            <UserAddOutlined className="text-lg text-teal-700" />
          </div>
          <p className="mb-0 text-sm text-slate-600">Creating and inviting new team members now sits inside a cleaner admin flow.</p>
        </div>
      </div>

      <SectionCard
        title={t('users.page.directoryTitle')}
        description={t('users.page.directoryDescription')}
      >
        <UserList />
      </SectionCard>
    </div>
  )
}
