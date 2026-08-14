import { App as AntdApp, ConfigProvider, Spin } from 'antd'
import enUS from 'antd/locale/en_US'
import viVN from 'antd/locale/vi_VN'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes } from 'react-router-dom'

import './assets/_app.scss'

import { AppShell } from './components/auth/AppShell'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { BookingsPage } from './pages/BookingsPage'
import { CarsPage } from './pages/CarsPage'
import { DashboardPage } from './pages/DashboardPage'
import { BookingDetailPage } from './pages/bookings/BookingDetailPage'
import { EditBookingPage } from './pages/bookings/EditBookingPage'
import { NewBookingPage } from './pages/bookings/NewBookingPage'
import { EditCarPage } from './pages/cars/EditCarPage'
import { CarCatalogPage } from './pages/cars/CarCatalogPage'
import { NewCarPage } from './pages/cars/NewCarPage'
import { FinancePage } from './pages/FinancePage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage'
import { CustomersPage } from './pages/customers/CustomersPage'
import { NewCustomerPage } from './pages/customers/NewCustomerPage'
import { NewUserPage } from './pages/users/NewUserPage'
import { UsersPage } from './pages/users/UsersPage'

function HomeRedirect() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center app-shell-bg">
        <Spin size="large" />
      </div>
    )
  }

  return <Navigate to={currentUser ? '/dashboard' : '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cars" element={<CarsPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/new" element={<NewBookingPage />} />
          <Route path="/bookings/edit/:id" element={<EditBookingPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/new" element={<NewCustomerPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/cars/new" element={<NewCarPage />} />
            <Route path="/cars/edit/:id" element={<EditCarPage />} />
            <Route path="/cars/catalog" element={<CarCatalogPage />} />
            <Route path="/cars/brands" element={<Navigate to="/cars/catalog" replace />} />
            <Route path="/cars/models" element={<Navigate to="/cars/catalog" replace />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/new" element={<NewUserPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  const { i18n } = useTranslation()
  const activeLanguage = i18n.resolvedLanguage?.startsWith('vi') ? 'vi' : 'en'

  return (
    <ConfigProvider
      locale={activeLanguage === 'vi' ? viVN : enUS}
      theme={{
        token: {
          colorPrimary: '#0f766e',
          colorInfo: '#0891b2',
          colorSuccess: '#16a34a',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          colorText: '#0f172a',
          colorTextSecondary: '#475569',
          colorBgBase: '#f8fafc',
          colorBgContainer: 'rgba(255, 255, 255, 0.92)',
          borderRadius: 16,
          borderRadiusLG: 24,
          controlHeight: 44,
          controlHeightLG: 48,
          fontSize: 15,
          wireframe: false,
          fontFamily: 'Space Grotesk, Source Sans 3, sans-serif',
        },
        components: {
          Button: {
            controlHeight: 44,
            fontWeight: 600,
          },
          Card: {
            borderRadiusLG: 24,
          },
          Layout: {
            headerBg: 'rgba(255, 255, 255, 0.82)',
            siderBg: 'rgba(2, 6, 23, 0.94)',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(20, 184, 166, 0.18)',
            darkItemSelectedColor: '#f0fdfa',
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f0fdfa',
          },
        },
      }}
    >
      <AntdApp>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  )
}
