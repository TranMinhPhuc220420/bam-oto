import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Empty, Grid, Skeleton, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { PaymentStatus } from '../../types/Booking'
import type { Transaction } from '../../types/Transaction'
import { toDate } from '../../utils/date'
import { EmptyCopy } from '../ui/EmptyCopy'
import { MoneyText } from '../ui/MoneyText'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
}

const statusColors: Record<PaymentStatus, string> = {
  unpaid: 'gold',
  partial: 'cyan',
  paid: 'green',
  refunded: 'volcano',
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-GB'

  const formatTime = (value: unknown) => {
    const date = toDate(value)

    if (!date) {
      return '—'
    }

    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const columns: ColumnsType<Transaction> = [
    {
      title: t('finance.list.time'),
      key: 'time',
      render: (_, record) => formatTime(record.paidAt ?? record.createdAt),
    },
    {
      title: t('finance.list.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: Transaction['type']) => t(`bookings.transactions.types.${type}`),
    },
    {
      title: t('finance.list.direction'),
      dataIndex: 'direction',
      key: 'direction',
      render: (direction: Transaction['direction']) => (
        <Tag color={direction === 'incoming' ? 'green' : 'volcano'} className="rounded-full px-3 py-1">
          {t(`finance.filters.${direction}`)}
        </Tag>
      ),
    },
    {
      title: t('finance.list.method'),
      dataIndex: 'method',
      key: 'method',
      render: (method: Transaction['method']) => t(`bookings.transactions.methods.${method}`),
    },
    {
      title: t('finance.list.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: PaymentStatus) => (
        <Tag color={statusColors[status]} className="rounded-full px-3 py-1 font-medium">
          {t(`bookings.paymentStatus.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('finance.list.booking'),
      dataIndex: 'bookingId',
      key: 'bookingId',
      render: (bookingId: string) =>
        bookingId ? (
          <button
            type="button"
            className="cursor-pointer bg-transparent p-0 text-left font-medium text-teal-700"
            onClick={() => navigate(`/bookings/${bookingId}`)}
          >
            {t('finance.list.openBooking')}
          </button>
        ) : (
          '—'
        ),
    },
    {
      title: t('finance.list.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number, record) => (
        <div className="flex min-w-0 items-center justify-end gap-2 font-semibold text-slate-900">
          {record.direction === 'incoming' ? (
            <ArrowDownOutlined className="text-emerald-600" />
          ) : (
            <ArrowUpOutlined className="text-rose-500" />
          )}
          <span className="min-w-0">
            <MoneyText value={amount ?? 0} language={i18n.resolvedLanguage} />
          </span>
        </div>
      ),
    },
  ]

  if (isMobile) {
    if (isLoading) {
      return (
        <div className="mobile-card-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`transaction-skeleton-${index}`}
              className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
            >
              <Skeleton active paragraph={{ rows: 3 }} title={{ width: '40%' }} />
            </div>
          ))}
        </div>
      )
    }

    if (!transactions.length) {
      return (
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<EmptyCopy title={t('finance.list.empty')} hint={t('finance.list.emptyHint')} />} />
        </div>
      )
    }

    return (
      <div className="mobile-card-list">
        {transactions.map((transaction) => (
          <article
            key={transaction.id}
            className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Typography.Text strong className="text-slate-900">
                  {t(`bookings.transactions.types.${transaction.type}`)}
                </Typography.Text>
                <div className="mt-1 text-xs text-slate-500">{formatTime(transaction.paidAt ?? transaction.createdAt)}</div>
              </div>
              <Tag color={transaction.direction === 'incoming' ? 'green' : 'volcano'} className="m-0 rounded-full px-3 py-1">
                {t(`finance.filters.${transaction.direction}`)}
              </Tag>
            </div>

            <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                {t(`bookings.transactions.methods.${transaction.method}`)}
              </div>
              <div className="min-w-0 font-semibold text-slate-900">
                <MoneyText value={transaction.amount ?? 0} language={i18n.resolvedLanguage} />
              </div>
            </div>

            {transaction.bookingId ? (
              <button
                type="button"
                className="mt-3 cursor-pointer bg-transparent p-0 text-sm font-medium text-teal-700"
                onClick={() => navigate(`/bookings/${transaction.bookingId}`)}
              >
                {t('finance.list.openBooking')}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    )
  }

  return (
    <Table
      className="data-table"
      columns={columns}
      dataSource={transactions}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
      scroll={{ x: 960 }}
      locale={{
        emptyText: (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<EmptyCopy title={t('finance.list.empty')} hint={t('finance.list.emptyHint')} />} />
        ),
      }}
    />
  )
}
