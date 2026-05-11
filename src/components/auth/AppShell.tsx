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
  DashboardOutlined,
  LogoutOutlined,
  MenuOutlined,
  PlusOutlined,
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
  | 'dashboard'
  | 'catalog'
  | 'newCar'
  | 'editCar'
  | 'cars'
  | 'bookings'
  | 'newBooking'
  | 'editBooking'
  | 'bookingDetail'
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
  { path: '/finance', key: 'finance' },
  { path: '/users/new', key: 'newUser' },
  { path: '/users', key: 'users' },
]

import logo from '../../assets/logo.png'

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, profile, signOut } = useAuth()
  const { i18n, t } = useTranslation()
  const screens = Grid.useBreakpoint()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const activeLanguage = i18n.resolvedLanguage?.startsWith('vi') ? 'vi' : 'en'
  const isCompactHeader = !screens.md
  const isMobile = screens.md === false;

  const items: MenuProps['items'] = useMemo(() => {
    const baseItems: MenuProps['items'] = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: t('shell.menu.dashboard') },
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
    routeMeta.find((route) => route.key === 'dashboard') ??
    routeMeta[0]

  const routeTitle = t(`shell.route.${currentRoute.key}.title`)
  const routeBreadcrumbs = t(`shell.route.${currentRoute.key}.breadcrumbs`, {
    returnObjects: true,
  }) as string[]

  const visibleBreadcrumbs = isCompactHeader
    ? routeBreadcrumbs.slice(-1)
    : !screens.lg
      ? routeBreadcrumbs.slice(-2)
      : routeBreadcrumbs

  const breadcrumbItems = visibleBreadcrumbs.map((item) => ({
    title: (
      <span className={`mobile-clamp-1 text-slate-500 ${isCompactHeader ? 'max-w-[140px]' : 'max-w-[220px]'}`}>
        {item}
      </span>
    ),
  }))

  const renderSidebarContent = () => (
    <div className="mobile-safe-bottom flex h-full flex-col px-3 py-4 text-slate-50 sm:px-4 sm:py-5">
      <div className="mb-4 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(15,118,110,0.18))] p-3.5 backdrop-blur sm:mb-5 sm:rounded-[24px] sm:p-4">
        {/* Logo and App Name and Company Name */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center bg-white rounded-[5px]">
            <img src={logo} alt="PLT Solutions" className="h-12 w-14" />
          </div>
          <div className="flex flex-col">
            <div className="font-semibold text-white text-2xl">
              {t('common.appName')}
            </div>
            PLT Solutions
          </div>
        </div>
        <Typography.Paragraph className="!mb-0 !text-sm !text-slate-300">
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

            <div className="min-w-0 space-y-0.5 sm:space-y-1">
              {!isMobile ? (
                <>
                  <Breadcrumb items={breadcrumbItems} className="min-w-0" />
                  <div>
                    <Typography.Title
                      level={isCompactHeader ? 4 : 3}
                      className="!mb-0 !truncate !text-slate-900 !text-xl sm:!text-2xl lg:!text-3xl"
                    >
                      {routeTitle}
                    </Typography.Title>
                  </div>
                </>
              )
                : (
                  <Typography.Title
                    level={3}
                    className="!mb-0 !truncate !text-slate-900 !text-lg sm:!text-xl"
                  >
                    {routeTitle}
                  </Typography.Title>
                )
              }
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
            {/* {!screens.lg ? (
              <div className="sticky top-0 z-10 -mx-0.5 lg:hidden">
                <div className="mobile-action-group rounded-[18px] border border-slate-200/80 bg-white/88 p-2 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)] backdrop-blur">
                  <Button
                    type={location.pathname.startsWith('/bookings') && location.pathname !== '/bookings/new' ? 'primary' : 'default'}
                    icon={<CalendarOutlined />}
                    onClick={() => navigate('/bookings')}
                  >
                    {t('shell.menu.bookings')}
                  </Button>
                  <Button
                    type={location.pathname.startsWith('/cars') ? 'primary' : 'default'}
                    icon={<CarOutlined />}
                    onClick={() => navigate('/cars')}
                  >
                    {t('shell.menu.cars')}
                  </Button>
                  <Button
                    type={location.pathname === '/bookings/new' ? 'primary' : 'default'}
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/bookings/new')}
                  >
                    {t('bookings.page.create')}
                  </Button>
                </div>
              </div>
            ) : null} */}

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
