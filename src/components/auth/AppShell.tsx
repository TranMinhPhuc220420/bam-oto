import {
  Alert,
  Avatar,
  Breadcrumb,
  Button,
  Drawer,
  Grid,
  Layout,
  Menu,
  Tag,
  Typography,
} from 'antd'
import type { MenuProps } from 'antd'
import {
  BankOutlined,
  CalendarOutlined,
  CarOutlined,
  LogoutOutlined,
  MenuOutlined,
  TagsOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'

const { Header, Content, Sider } = Layout

const publicDomain = import.meta.env.VITE_PUBLIC_DOMAIN ?? 'bam.plt.pro.vn'

type RouteKey =
  | 'catalog'
  | 'newCar'
  | 'editCar'
  | 'cars'
  | 'bookings'
  | 'newBooking'
  | 'editBooking'
  | 'finance'
  | 'newUser'
  | 'users'

type RouteMeta = {
  path: string
  key: RouteKey
}

const routeMeta: RouteMeta[] = [
  { path: '/cars/catalog', key: 'catalog' },
  { path: '/cars/new', key: 'newCar' },
  { path: '/cars/edit', key: 'editCar' },
  { path: '/cars', key: 'cars' },
  { path: '/bookings/new', key: 'newBooking' },
  { path: '/bookings/edit', key: 'editBooking' },
  { path: '/bookings', key: 'bookings' },
  { path: '/finance', key: 'finance' },
  { path: '/users/new', key: 'newUser' },
  { path: '/users', key: 'users' },
]

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, profile, signOut } = useAuth()
  const { i18n, t } = useTranslation()
  const screens = Grid.useBreakpoint()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const activeLanguage = i18n.resolvedLanguage?.startsWith('vi') ? 'vi' : 'en'

  const items: MenuProps['items'] = useMemo(() => {
    const baseItems: MenuProps['items'] = [
      { key: '/bookings', icon: <CalendarOutlined />, label: t('shell.menu.bookings') },
      { key: '/cars', icon: <CarOutlined />, label: t('shell.menu.cars') },
    ]

    if (profile?.role === 'admin') {
      baseItems.push({ key: '/cars/catalog', icon: <TagsOutlined />, label: t('shell.menu.catalog') })
      baseItems.push({ key: '/finance', icon: <BankOutlined />, label: t('shell.menu.finance') })
      baseItems.push({ key: '/users', icon: <TeamOutlined />, label: t('shell.menu.users') })
    }

    return baseItems
  }, [profile?.role, t])

  const selectedKey = items
    .map((item) => (typeof item?.key === 'string' ? item.key : ''))
    .sort((left, right) => right.length - left.length)
    .find((key) => location.pathname.startsWith(key))

  const currentRoute =
    [...routeMeta]
      .sort((left, right) => right.path.length - left.path.length)
      .find((route) => location.pathname.startsWith(route.path)) ??
    routeMeta.find((route) => route.key === 'cars') ??
    routeMeta[0]

  const routeTitle = t(`shell.route.${currentRoute.key}.title`)
  const routeBreadcrumbs = t(`shell.route.${currentRoute.key}.breadcrumbs`, {
    returnObjects: true,
  }) as string[]

  const breadcrumbItems = routeBreadcrumbs.map((item) => ({
    title: <span className="text-slate-500">{item}</span>,
  }))

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col px-4 py-5 text-slate-50">
      <div className="mb-5 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(15,118,110,0.18))] p-4 backdrop-blur">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-teal-300">
          {publicDomain}
        </p>
        <Typography.Title level={3} className="!mb-2 !text-white">
          {t('common.appName')}
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 !text-slate-300">
          {t('shell.sidebarDescription')}
        </Typography.Paragraph>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={items}
        onClick={({ key }) => {
          setMobileNavOpen(false)
          navigate(key)
        }}
        className="flex-1 border-0 bg-transparent"
      />

      <div className="mt-6 rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur">
        <div className="mb-4 flex items-start gap-3">
          <Avatar size={42} className="bg-teal-500">
            {currentUser?.email?.slice(0, 1)?.toUpperCase()}
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="mb-1 truncate text-sm font-semibold text-white">{currentUser?.email}</p>
            <div className="flex flex-wrap gap-2">
              <Tag color="cyan" className="m-0 rounded-full">
                {t(`common.roles.${profile?.role ?? 'unknown'}`)}
              </Tag>
              <Tag color={currentUser?.emailVerified ? 'green' : 'gold'} className="m-0 rounded-full">
                {currentUser?.emailVerified
                  ? t('common.states.verified')
                  : t('common.states.pendingVerification')}
              </Tag>
            </div>
          </div>
        </div>

        <Button type="primary" block icon={<LogoutOutlined />} onClick={() => void signOut()}>
          {t('common.actions.signOut')}
        </Button>
      </div>
    </div>
  )

  return (
    <Layout className="h-screen overflow-hidden bg-transparent">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        className="!hidden border-r border-slate-900/70 bg-slate-950/95 backdrop-blur lg:!block"
        width={284}
      >
        {renderSidebarContent()}
      </Sider>

      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        placement="left"
        closable={false}
        size="default"
        styles={{ body: { padding: 0, background: '#020617' } }}
      >
        {renderSidebarContent()}
      </Drawer>

      <Layout className="app-shell-bg h-screen overflow-hidden">
        <Header className="z-20 flex h-auto items-center justify-between gap-4 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {!screens.lg ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileNavOpen(true)}
                className="shrink-0"
              />
            ) : null}

            <div className="min-w-0 space-y-1">
              <Breadcrumb items={breadcrumbItems} />
              <div>
                <Typography.Title level={3} className="!mb-0 !truncate !text-slate-900">
                  {routeTitle}
                </Typography.Title>
                {/* Hidden */}
                {/* <Typography.Paragraph className="!mb-0 !truncate !text-sm !text-slate-500">
                  {routeDescription}
                </Typography.Paragraph> */}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <LanguageSwitcher />

            <div className="hidden rounded-full border border-slate-200/70 bg-white px-3 py-1.5 text-sm text-slate-600 lg:block">
              {t('common.labels.today')} •{' '}
              <span className="font-semibold text-slate-900">
                {new Intl.DateTimeFormat(activeLanguage === 'vi' ? 'vi-VN' : 'en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date())}
              </span>
            </div>

            <Tag className="m-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-teal-700">
              {t(`common.roles.${profile?.role ?? 'unknown'}`)}
            </Tag>
          </div>
        </Header>

        <Content className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-[1440px] space-y-6">
            {/* {!currentUser?.emailVerified ? (
              <Alert
                className="rounded-2xl border border-amber-200 bg-amber-50"
                type="warning"
                showIcon
                closable
                title={t('shell.verification.title')}
                description={t('shell.verification.description')}
              />
            ) : null} */}

            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
