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
import { Button, Descriptions, Drawer, Space, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { calculateBookingFinancials, getBookingAdjustmentItems, getBookingExtraChargeItems } from '../../services/bookingService'
import { Booking, BookingStatus, PaymentStatus } from '../../types/Booking'
import { formatCurrencyVnd } from '../../utils/currency'
import { BookingDocumentsPreview } from './BookingDocumentsPreview'
import { BookingTransactionList } from './BookingTransactionList'

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

function toDate(value: unknown) {
  if (value instanceof Date) {
    return value
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate()
  }

  return null
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
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_140px] gap-3 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span>{labels.label}</span>
          <span>{labels.type}</span>
          <span className="text-right">{labels.amount}</span>
        </div>

        {items.map((item) => (
          <div
            key={item.key}
            className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_140px] gap-3 border-t border-slate-100 px-4 py-3"
          >
            <div className="min-w-0">
              <Typography.Text className="block text-sm font-medium text-slate-900">
                {item.label}
              </Typography.Text>
              {item.note ? <Typography.Text className="text-xs text-slate-500">{item.note}</Typography.Text> : null}
            </div>
            <Typography.Text className="text-sm text-slate-600">{item.typeLabel}</Typography.Text>
            <Typography.Text className="text-right text-sm font-semibold text-slate-900">
              {formatCurrencyVnd(item.amount, locale)}
            </Typography.Text>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BookingDetailDrawer({ booking, open, onClose, onEdit }: BookingDetailDrawerProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-GB'

  if (!booking) {
    return <Drawer open={open} onClose={onClose} title={t('bookings.details.title')} size="large" />
  }

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

  const formatCurrency = (value: number) => formatCurrencyVnd(value, i18n.resolvedLanguage)

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
    <Drawer
      open={open}
      onClose={onClose}
      title={t('bookings.details.title')}
      size="large"
      extra={
        <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(booking)}>
          {t('common.actions.edit')}
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="space-y-3">
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

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
          <Typography.Text className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('bookings.details.paymentSummary')}
          </Typography.Text>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Typography.Text className="text-xs text-slate-500">{t('bookings.finance.fixedTotal')}</Typography.Text>
              <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(financials.fixedTotal)}</div>
            </div>
            <div>
              <Typography.Text className="text-xs text-slate-500">{t('bookings.finance.surchargeTotal')}</Typography.Text>
              <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(financials.extraChargesTotal)}</div>
            </div>
            <div>
              <Typography.Text className="text-xs text-slate-500">{t('bookings.finance.adjustmentTotal')}</Typography.Text>
              <div className="mt-1 text-lg font-semibold text-rose-600">{formatCurrency(financials.discountRefundTotal)}</div>
            </div>
            <div>
              <Typography.Text className="text-xs text-slate-500">{t('bookings.finance.total')}</Typography.Text>
              <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(financials.totalPrice)}</div>
            </div>
            <div>
              <Typography.Text className="text-xs text-slate-500">{t('bookings.details.paidAmount')}</Typography.Text>
              <div className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(financials.paidAmount)}</div>
            </div>
            <div>
              <Typography.Text className="text-xs text-slate-500">{t('bookings.details.remainingAmount')}</Typography.Text>
              <div className="mt-1 text-lg font-semibold text-amber-700">{formatCurrency(financials.remainingAmount)}</div>
            </div>
            <div>
              <Typography.Text className="text-xs text-slate-500">{t('bookings.details.refundAmount')}</Typography.Text>
              <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(financials.refundAmount)}</div>
            </div>
            <div>
              <Typography.Text className="text-xs text-slate-500">{t('bookings.details.securityDeposit')}</Typography.Text>
              <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(financials.securityDeposit)}</div>
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
    </Drawer>
  )
}
