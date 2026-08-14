import { useMemo } from 'react'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Empty, Skeleton, Table, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { useTranslation } from 'react-i18next'

import { useBookingTransactions } from '../../hooks/useBookingTransactions'
import { getBookingAdjustmentItems, getBookingExtraChargeItems } from '../../services/bookingService'
import { Booking } from '../../types/Booking'
import { Transaction } from '../../types/Transaction'
import { toDate } from '../../utils/date'
import { MoneyText } from '../ui/MoneyText'

interface BookingTransactionListProps {
  bookingId?: string
  booking?: Booking | null
}

interface CashflowHistoryRow {
  key: string
  occurredAt: Date | null
  source: 'payment' | 'surcharge' | 'adjustment'
  typeLabel: string
  detail: string
  amount: number
  direction: 'incoming' | 'outgoing'
  status?: Transaction['status']
}

const statusColors: Record<Transaction['status'], string> = {
  unpaid: 'gold',
  partial: 'cyan',
  paid: 'green',
  refunded: 'volcano',
}

export function BookingTransactionList({ bookingId, booking }: BookingTransactionListProps) {
  const { t, i18n } = useTranslation()
  const { transactions, loading } = useBookingTransactions(booking?.id ?? bookingId)
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-GB'

  const historyRows = useMemo<CashflowHistoryRow[]>(() => {
    const surchargeRows = getBookingExtraChargeItems({
      extraChargeItems: booking?.extraChargeItems,
      extraCharges: booking?.extraCharges,
    }).map((item) => ({
      key: `charge-${item.id}`,
      occurredAt: toDate(item.createdAt),
      source: 'surcharge' as const,
      typeLabel: t(`bookings.chargeTypes.${item.type}`),
      detail: [item.label, item.note].filter(Boolean).join(' • ') || t('bookings.details.noValue'),
      amount: item.amount,
      direction: 'incoming' as const,
    }))

    const adjustmentRows = getBookingAdjustmentItems({
      adjustmentItems: booking?.adjustmentItems,
      discountAmount: booking?.discountAmount,
      refundAmount: booking?.refundAmount,
    }).map((item) => ({
      key: `adjustment-${item.id}`,
      occurredAt: toDate(item.createdAt),
      source: 'adjustment' as const,
      typeLabel: t(`bookings.adjustmentTypes.${item.type}`),
      detail: [item.label, item.note].filter(Boolean).join(' • ') || t('bookings.details.noValue'),
      amount: item.amount,
      direction: 'outgoing' as const,
    }))

    const paymentRows = transactions.map((transaction) => ({
      key: `transaction-${transaction.id ?? `${transaction.type}-${transaction.amount}`}`,
      occurredAt: toDate(transaction.paidAt ?? transaction.updatedAt),
      source: 'payment' as const,
      typeLabel: t(`bookings.transactions.types.${transaction.type}`),
      detail: [t(`bookings.transactions.methods.${transaction.method}`), transaction.note].filter(Boolean).join(' • '),
      amount: transaction.amount ?? 0,
      direction: transaction.direction,
      status: transaction.status,
    }))

    return [...surchargeRows, ...adjustmentRows, ...paymentRows].sort((left, right) => {
      const leftTime = left.occurredAt?.getTime() ?? 0
      const rightTime = right.occurredAt?.getTime() ?? 0

      return rightTime - leftTime
    })
  }, [booking?.adjustmentItems, booking?.extraChargeItems, booking?.extraCharges, booking?.discountAmount, booking?.refundAmount, t, transactions])

  const columns: TableColumnsType<CashflowHistoryRow> = [
    {
      title: t('bookings.transactions.time'),
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 180,
      render: (value: Date | null) =>
        value
          ? new Intl.DateTimeFormat(locale, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(value)
          : t('bookings.details.noValue'),
    },
    {
      title: t('bookings.transactions.event'),
      key: 'event',
      render: (_, row) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="rounded-full px-3 py-1">{t(`bookings.transactions.events.${row.source}`)}</Tag>
            {row.status ? (
              <Tag color={statusColors[row.status]} className="rounded-full px-3 py-1 font-medium">
                {t(`bookings.paymentStatus.${row.status}`)}
              </Tag>
            ) : null}
          </div>
          <Typography.Text className="text-sm font-medium text-slate-900">{row.typeLabel}</Typography.Text>
        </div>
      ),
    },
    {
      title: t('bookings.transactions.detail'),
      dataIndex: 'detail',
      key: 'detail',
      render: (value: string) => <Typography.Text className="text-sm text-slate-600">{value || t('bookings.details.noValue')}</Typography.Text>,
    },
    {
      title: t('bookings.transactions.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 180,
      render: (value: number, row) => (
        <div className="flex min-w-0 items-center justify-end gap-2 font-semibold text-slate-900">
          {row.direction === 'incoming' ? (
            <ArrowDownOutlined className="text-emerald-600" />
          ) : (
            <ArrowUpOutlined className="text-rose-500" />
          )}
          <span className="min-w-0">
            <MoneyText value={value ?? 0} language={i18n.resolvedLanguage} />
          </span>
        </div>
      ),
    },
  ]

  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />
  }

  if (!historyRows.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('bookings.transactions.empty')} />
  }

  return (
    <Table
      rowKey="key"
      size="small"
      pagination={false}
      columns={columns}
      dataSource={historyRows}
      scroll={{ x: 760 }}
    />
  )
}
