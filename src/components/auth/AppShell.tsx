import {
  Avatar,
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
  DashboardOutlined,
  LogoutOutlined,
  MenuOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'
import logo from '../../assets/logo.png'

const { Header, Content, Sider } = Layout

type RouteKey =
  | 'dashboard'
  | 'catalog'
  | 'newCar'
  | 'editCar'
  | 'cars'
  | 'bookings'
  | 'newBooking'
  | 'editBooking'
  | 'bookingDetail'
  | 'customers'
  | 'newCustomer'
  | 'customerDetail'
  | 'finance'
  | 'newUser'
  | 'users'

type RouteMeta = {
  path: string
  key: RouteKey
}

const routeMeta: RouteMeta[] = [
  { path: '/dashboard', key: 'dashboard' },
  { path: '/cars/catalog', key: 'catalog' },
  { path: '/cars/new', key: 'newCar' },
  { path: '/cars/edit', key: 'editCar' },
  { path: '/cars', key: 'cars' },
  { path: '/bookings/new', key: 'newBooking' },
  { path: '/bookings/edit', key: 'editBooking' },
  { path: '/bookings/', key: 'bookingDetail' },
  { path: '/bookings', key: 'bookings' },
  { path: '/customers/new', key: 'newCustomer' },
  { path: '/customers/', key: 'customerDetail' },
  { path: '/customers', key: 'customers' },
  { path: '/finance', key: 'finance' },
  { path: '/users/new', key: 'newUser' },
  { path: '/users', key: 'users' },
]

function collectMenuKeys(items: MenuProps['items']): string[] {
  return (items ?? []).flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return []
    }

    if ('children' in item && Array.isArray(item.children)) {
      return collectMenuKeys(item.children as MenuProps['items'])
    }

    return typeof item.key === 'string' ? [item.key] : []
  })
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, profile, signOut } = useAuth()
  const { i18n, t } = useTranslation()
  const screens = Grid.useBreakpoint()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const activeLanguage = i18n.resolvedLanguage?.startsWith('vi') ? 'vi' : 'en'
  const isCompactHeader = !screens.md
  const isMobile = screens.md === false
  const isAdmin = profile?.role === 'admin'

  const items: MenuProps['items'] = useMemo(() => {
    const operations: MenuProps['items'] = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: t('shell.menu.dashboard') },
      { key: '/bookings', icon: <CalendarOutlined />, label: t('shell.menu.bookings') },
      { key: '/customers', icon: <UserOutlined />, label: t('shell.menu.customers') },
    ]

    const fleet: MenuProps['items'] = [
      { key: '/cars', icon: <CarOutlined />, label: t('shell.menu.cars') },
    ]

    if (isAdmin) {
      fleet.push({ key: '/cars/catalog', icon: <TagsOutlined />, label: t('shell.menu.catalog') })
    }

    const groups: MenuProps['items'] = [
      {
        type: 'group',
        label: t('shell.menu.groups.operations'),
        children: operations,
      },
      {
        type: 'group',
        label: t('shell.menu.groups.fleet'),
        children: fleet,
      },
    ]

    if (isAdmin) {
      groups.push({
        type: 'group',
        label: t('shell.menu.groups.admin'),
        children: [
          { key: '/finance', icon: <BankOutlined />, label: t('shell.menu.finance') },
          { key: '/users', icon: <TeamOutlined />, label: t('shell.menu.users') },
        ],
      })
    }

    return groups
  }, [isAdmin, t])

  const selectedKey = collectMenuKeys(items)
    .sort((left, right) => right.length - left.length)
    .find((key) => location.pathname.startsWith(key))

  const currentRoute =
    [...routeMeta]
      .sort((left, right) => right.path.length - left.path.length)
      .find((route) => location.pathname.startsWith(route.path)) ??
    routeMeta.find((route) => route.key === 'dashboard') ??
    routeMeta[0]

  const routeTitle = t(`shell.route.${currentRoute.key}.title`)
  const routeDescription = t(`shell.route.${currentRoute.key}.description`)

  const renderSidebarContent = () => (
    <div className="mobile-safe-bottom flex h-full flex-col px-3 py-4 text-slate-50 sm:px-4 sm:py-5">
      <div className="mb-4 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(15,118,110,0.18))] p-3.5 backdrop-blur sm:mb-5 sm:rounded-[24px] sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-12 w-14 items-center justify-center rounded-[5px] bg-white">
            <img src={logo} alt={t('common.logoAlt')} className="h-12 w-14" />
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="text-2xl font-semibold text-white">{t('common.appName')}</div>
            <span className="text-sm text-slate-300">{t('common.companyName')}</span>
          </div>
        </div>
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

      <div className="mt-6 space-y-3 rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur">
        {isMobile ? <LanguageSwitcher /> : null}

        <div className="flex items-start gap-3">
          <Avatar size={42} className="bg-teal-500">
            {currentUser?.email?.slice(0, 1)?.toUpperCase()}
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="mb-1 truncate text-sm font-semibold text-white">{currentUser?.email}</p>
            <Tag color="cyan" className="m-0 rounded-full">
              {t(`common.roles.${profile?.role ?? 'unknown'}`)}
            </Tag>
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
        width={screens.sm ? 320 : 'calc(100vw - 40px)'}
        styles={{ body: { padding: 0, background: '#020617' } }}
      >
        {renderSidebarContent()}
      </Drawer>

      <Layout className="app-shell-bg h-screen overflow-hidden">
        <Header className="z-20 flex h-auto items-center justify-between gap-3 border-b border-slate-200/70 bg-white/85 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            {!screens.lg ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileNavOpen(true)}
                className="shrink-0"
              />
            ) : null}

            <div className="min-w-0 space-y-0.5">
              <Typography.Title
                level={isCompactHeader ? 4 : 3}
                className={`!mb-0 !truncate !text-slate-900 ${isMobile ? '!text-lg sm:!text-xl' : '!text-xl sm:!text-2xl lg:!text-3xl'}`}
              >
                {routeTitle}
              </Typography.Title>
              {!isMobile ? (
                <p className="mb-0 truncate text-sm text-slate-500">{routeDescription}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:flex-wrap">
            {!isMobile && <LanguageSwitcher />}

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

            <Tag className="m-0 hidden rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-teal-700 sm:inline-flex">
              {t(`common.roles.${profile?.role ?? 'unknown'}`)}
            </Tag>
          </div>
        </Header>

        <Content className="mobile-page-padding mobile-safe-bottom min-h-0 flex-1 overflow-y-auto px-0 pb-6 pt-3 sm:pt-4 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-[1440px] space-y-4 sm:space-y-6">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
