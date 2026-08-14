import {
  BankOutlined,
  CalendarOutlined,
  CarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Descriptions, Drawer, Grid, Space, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { calculateBookingFinancials, getBookingAdjustmentItems, getBookingExtraChargeItems } from '../../services/bookingService'
import { Booking, BookingStatus, PaymentStatus } from '../../types/Booking'
import { toDate } from '../../utils/date'
import { BookingDocumentsPreview } from './BookingDocumentsPreview'
import { BookingTransactionList } from './BookingTransactionList'
import { MoneyText } from '../ui/MoneyText'

interface BookingDetailDrawerProps {
  booking: Booking | null
  open: boolean
  onClose: () => void
  onEdit: (booking: Booking) => void
}

interface BreakdownRow {
  key: string
  label: string
  typeLabel: string
  amount: number
  note?: string
}

const statusColors: Record<BookingStatus, string> = {
  draft: 'default',
  confirmed: 'green',
  'in-progress': 'blue',
  completed: 'purple',
  canceled: 'red',
}

const paymentColors: Record<PaymentStatus, string> = {
  unpaid: 'gold',
  partial: 'cyan',
  paid: 'green',
  refunded: 'volcano',
}

function getBookingDocumentUrls(documentUrls?: string[], documentUrl?: string) {
  return Array.from(new Set([...(documentUrls ?? []), ...(documentUrl ? [documentUrl] : [])].filter(Boolean)))
}

function BreakdownSection({
  title,
  items,
  locale,
  emptyText,
  labels,
}: {
  title: string
  items: BreakdownRow[]
  locale: string
  emptyText: string
  labels: { label: string; type: string; amount: string }
}) {
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false

  if (!items.length) {
    return (
      <div className="space-y-2">
        <Typography.Title level={5} className="!mb-0 text-slate-900">
          {title}
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {emptyText}
        </Typography.Paragraph>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Typography.Title level={5} className="!mb-0 text-slate-900">
        {title}
      </Typography.Title>

      {isMobile ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.key} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Typography.Text className="block text-sm font-medium text-slate-900">
                    {item.label}
                  </Typography.Text>
                  <Typography.Text className="block text-xs text-slate-500">
                    {labels.type}: {item.typeLabel}
                  </Typography.Text>
                  {item.note ? <Typography.Text className="block text-xs text-slate-500">{item.note}</Typography.Text> : null}
                </div>

                <Typography.Text className="min-w-0 text-right text-sm font-semibold text-slate-900">
                  <MoneyText value={item.amount} language={locale} />
                </Typography.Text>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>{labels.label}</span>
            <span>{labels.type}</span>
            <span className="text-right">{labels.amount}</span>
          </div>

          {items.map((item) => (
            <div
              key={item.key}
              className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-t border-slate-100 px-4 py-3"
            >
              <div className="min-w-0">
                <Typography.Text className="block text-sm font-medium text-slate-900">
                  {item.label}
                </Typography.Text>
                {item.note ? <Typography.Text className="text-xs text-slate-500">{item.note}</Typography.Text> : null}
              </div>
              <Typography.Text className="text-sm text-slate-600">{item.typeLabel}</Typography.Text>
              <Typography.Text className="min-w-0 text-right text-sm font-semibold text-slate-900">
                <MoneyText value={item.amount} language={locale} />
              </Typography.Text>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function BookingDetailContent({ booking }: { booking: Booking }) {
  const { t, i18n } = useTranslation()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-GB'

  const startDate = toDate(booking.startDate)
  const endDate = toDate(booking.endDate)
  const createdAt = toDate(booking.createdAt)
  const updatedAt = toDate(booking.updatedAt)
  const documentUrls = getBookingDocumentUrls(booking.documentUrls, booking.documentUrl)
  const isOverdue = !!endDate && dayjs(endDate).isBefore(dayjs()) && !['completed', 'canceled'].includes(booking.status)
  const financials = calculateBookingFinancials({
    totalPrice: booking.totalPrice,
    rentalAmount: booking.rentalAmount,
    depositAmount: booking.depositAmount,
    securityDeposit: booking.securityDeposit,
    extraChargeItems: booking.extraChargeItems,
    adjustmentItems: booking.adjustmentItems,
    extraCharges: booking.extraCharges,
    discountAmount: booking.discountAmount,
    paidAmount: booking.paidAmount,
    refundAmount: booking.refundAmount,
    paymentStatus: booking.paymentStatus,
  })

  const formatDateTime = (value: Date | null) => {
    if (!value) {
      return t('bookings.details.noValue')
    }

    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(value)
  }

  const durationDays =
    startDate && endDate ? Math.max(1, Math.ceil(dayjs(endDate).diff(dayjs(startDate), 'day', true))) : null

  const fixedRows: BreakdownRow[] = [
    {
      key: 'rental',
      label: t('bookings.details.rentalAmount'),
      typeLabel: t('bookings.details.fixedCharges'),
      amount: financials.rentalAmount,
    },
    {
      key: 'deposit',
      label: t('bookings.details.depositAmount'),
      typeLabel: t('bookings.details.fixedCharges'),
      amount: financials.depositAmount,
    },
    {
      key: 'security',
      label: t('bookings.details.securityDeposit'),
      typeLabel: t('bookings.details.fixedCharges'),
      amount: financials.securityDeposit,
    },
  ].filter((item) => item.amount > 0 || item.key === 'rental')

  const surchargeRows: BreakdownRow[] = getBookingExtraChargeItems({
    extraChargeItems: booking.extraChargeItems,
    extraCharges: booking.extraCharges,
  }).map((item) => ({
    key: item.id,
    label: item.label || t(`bookings.chargeTypes.${item.type}`),
    typeLabel: t(`bookings.chargeTypes.${item.type}`),
    amount: item.amount,
    note: item.note,
  }))

  const adjustmentRows: BreakdownRow[] = getBookingAdjustmentItems({
    adjustmentItems: booking.adjustmentItems,
    discountAmount: booking.discountAmount,
    refundAmount: booking.refundAmount,
  }).map((item) => ({
    key: item.id,
    label: item.label || t(`bookings.adjustmentTypes.${item.type}`),
    typeLabel: t(`bookings.adjustmentTypes.${item.type}`),
    amount: item.amount,
    note: item.note,
  }))

  return (
    <div className="space-y-5 md:space-y-6">
      <div className={isMobile ? 'rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5' : 'space-y-3'}>
        <div className="flex flex-wrap items-center gap-2">
          <Typography.Title level={4} className="!mb-0 !text-slate-900">
            {booking.bookingCode}
          </Typography.Title>
          <Tag color={statusColors[booking.status]} className="rounded-full px-3 py-1 font-medium">
            {t(`bookings.status.${booking.status}`)}
          </Tag>
          <Tag color={paymentColors[booking.paymentStatus]} className="rounded-full px-3 py-1 font-medium">
            {t(`bookings.paymentStatus.${booking.paymentStatus}`)}
          </Tag>
          {isOverdue ? <Tag color="red">{t('bookings.details.overdue')}</Tag> : null}
        </div>

        <Typography.Paragraph className="!mb-0 text-slate-600">
          {startDate && endDate ? `${formatDateTime(startDate)} → ${formatDateTime(endDate)}` : t('bookings.details.noValue')}
        </Typography.Paragraph>

        {isMobile ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <Typography.Text className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                {t('bookings.details.customer')}
              </Typography.Text>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {booking.customerSnapshot?.fullName ?? t('bookings.details.noValue')}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <Typography.Text className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                {t('bookings.details.car')}
              </Typography.Text>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {[booking.carSnapshot?.plateNumber, booking.carSnapshot?.brand, booking.carSnapshot?.model]
                  .filter(Boolean)
                  .join(' • ') || t('bookings.details.noValue')}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Descriptions
        column={1}
        size="small"
        items={[
          {
            key: 'customer',
            label: (
              <Space>
                <UserOutlined />
                {t('bookings.details.customer')}
              </Space>
            ),
            children: booking.customerSnapshot?.fullName ?? t('bookings.details.noValue'),
          },
          {
            key: 'phone',
            label: (
              <Space>
                <PhoneOutlined />
                {t('bookings.details.phone')}
              </Space>
            ),
            children: booking.customerSnapshot?.phoneNumber ?? t('bookings.details.noValue'),
          },
          {
            key: 'car',
            label: (
              <Space>
                <CarOutlined />
                {t('bookings.details.car')}
              </Space>
            ),
            children: [booking.carSnapshot?.plateNumber, booking.carSnapshot?.brand, booking.carSnapshot?.model]
              .filter(Boolean)
              .join(' • '),
          },
          {
            key: 'duration',
            label: (
              <Space>
                <ClockCircleOutlined />
                {t('bookings.details.duration')}
              </Space>
            ),
            children: durationDays ? t('bookings.details.durationDays', { count: durationDays }) : t('bookings.details.noValue'),
          },
          {
            key: 'pickup',
            label: (
              <Space>
                <EnvironmentOutlined />
                {t('bookings.details.pickupLocation')}
              </Space>
            ),
            children: booking.pickupLocation || t('bookings.details.noValue'),
          },
          {
            key: 'return',
            label: (
              <Space>
                <EnvironmentOutlined />
                {t('bookings.details.returnLocation')}
              </Space>
            ),
            children: booking.returnLocation || t('bookings.details.noValue'),
          },
          {
            key: 'paymentMethod',
            label: (
              <Space>
                <BankOutlined />
                {t('bookings.details.paymentMethod')}
              </Space>
            ),
            children: t(`bookings.methods.${booking.paymentMethod ?? 'other'}`),
          },
          {
            key: 'timeline',
            label: (
              <Space>
                <CalendarOutlined />
                {t('bookings.details.timeline')}
              </Space>
            ),
            children: `${formatDateTime(createdAt)} • ${t('bookings.details.updatedAt')}: ${formatDateTime(updatedAt)}`,
          },
        ]}
      />

      <div className="mb-5"></div>


      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
        <Typography.Text className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {t('bookings.details.paymentSummary')}
        </Typography.Text>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
            <Typography.Text className="text-xs text-slate-500">{t('bookings.finance.fixedTotal')}</Typography.Text>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              <MoneyText value={financials.fixedTotal} language={i18n.resolvedLanguage} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
            <Typography.Text className="text-xs text-slate-500">{t('bookings.finance.surchargeTotal')}</Typography.Text>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              <MoneyText value={financials.extraChargesTotal} language={i18n.resolvedLanguage} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
            <Typography.Text className="text-xs text-slate-500">{t('bookings.finance.adjustmentTotal')}</Typography.Text>
            <div className="mt-1 text-lg font-semibold text-rose-600">
              <MoneyText value={financials.discountRefundTotal} language={i18n.resolvedLanguage} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
            <Typography.Text className="text-xs text-slate-500">{t('bookings.finance.total')}</Typography.Text>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              <MoneyText value={financials.totalPrice} language={i18n.resolvedLanguage} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
            <Typography.Text className="text-xs text-slate-500">{t('bookings.details.paidAmount')}</Typography.Text>
            <div className="mt-1 text-lg font-semibold text-emerald-700">
              <MoneyText value={financials.paidAmount} language={i18n.resolvedLanguage} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
            <Typography.Text className="text-xs text-slate-500">{t('bookings.details.remainingAmount')}</Typography.Text>
            <div className="mt-1 text-lg font-semibold text-amber-700">
              <MoneyText value={financials.remainingAmount} language={i18n.resolvedLanguage} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
            <Typography.Text className="text-xs text-slate-500">{t('bookings.details.refundAmount')}</Typography.Text>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              <MoneyText value={financials.refundAmount} language={i18n.resolvedLanguage} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
            <Typography.Text className="text-xs text-slate-500">{t('bookings.details.securityDeposit')}</Typography.Text>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              <MoneyText value={financials.securityDeposit} language={i18n.resolvedLanguage} />
            </div>
          </div>
        </div>
      </div>

      <BreakdownSection
        title={t('bookings.details.fixedCharges')}
        items={fixedRows}
        locale={locale}
        emptyText={t('bookings.details.lineItemsEmpty')}
        labels={{
          label: t('bookings.details.label'),
          type: t('bookings.details.type'),
          amount: t('bookings.details.amount'),
        }}
      />

      <BreakdownSection
        title={t('bookings.details.surcharges')}
        items={surchargeRows}
        locale={locale}
        emptyText={t('bookings.details.lineItemsEmpty')}
        labels={{
          label: t('bookings.details.label'),
          type: t('bookings.details.type'),
          amount: t('bookings.details.amount'),
        }}
      />

      <BreakdownSection
        title={t('bookings.details.adjustments')}
        items={adjustmentRows}
        locale={locale}
        emptyText={t('bookings.details.lineItemsEmpty')}
        labels={{
          label: t('bookings.details.label'),
          type: t('bookings.details.type'),
          amount: t('bookings.details.amount'),
        }}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <BankOutlined />
          <Typography.Title level={5} className="!mb-0">
            {t('bookings.transactions.title')}
          </Typography.Title>
        </div>
        <BookingTransactionList booking={booking} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <FileTextOutlined />
          <Typography.Title level={5} className="!mb-0">
            {t('bookings.details.documents')}
          </Typography.Title>
        </div>
        <BookingDocumentsPreview urls={documentUrls} emptyText={t('bookings.upload.previewEmpty')} />
      </div>

      <div className="space-y-2">
        <Typography.Title level={5} className="!mb-0 text-slate-900">
          {t('bookings.details.note')}
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-slate-600">
          {booking.note?.trim() || t('bookings.details.noNote')}
        </Typography.Paragraph>
      </div>
    </div>
  )
}

export function BookingDetailDrawer({ booking, open, onClose, onEdit }: BookingDetailDrawerProps) {
  const { t } = useTranslation()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('bookings.details.title')}
      placement={isMobile ? 'bottom' : 'right'}
      size={isMobile ? undefined : 'large'}
      height={isMobile ? '92vh' : undefined}
      styles={{ body: { padding: isMobile ? 12 : 24 } }}
      extra={
        booking ? (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(booking)}
            size={isMobile ? 'large' : 'middle'}
          >
            {t('common.actions.edit')}
          </Button>
        ) : null
      }
    >
      {booking ? <BookingDetailContent booking={booking} /> : null}
    </Drawer>
  )
}
