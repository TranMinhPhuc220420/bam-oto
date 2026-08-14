import { useMemo, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  NumberOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Button, DatePicker, Select } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'

import { TransactionList } from '../components/finance/TransactionList'
import { MetricCard } from '../components/ui/MetricCard'
import { SectionCard } from '../components/ui/SectionCard'
import { useBookings } from '../hooks/useBookings'
import { useTransactions } from '../hooks/useTransactions'
import type { TransactionDirection, TransactionType } from '../types/Transaction'
import { MoneyText } from '../components/ui/MoneyText'

const transactionTypes: TransactionType[] = [
  'booking',
  'deposit',
  'security-deposit',
  'final-payment',
  'late-fee',
  'damage-fee',
  'surcharge',
  'discount',
  'refund',
]

function getCurrentMonthRange(): [Dayjs, Dayjs] {
  return [dayjs().startOf('month'), dayjs().endOf('month')]
}

export function FinancePage() {
  const { t, i18n } = useTranslation()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(getCurrentMonthRange)
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')
  const [directionFilter, setDirectionFilter] = useState<TransactionDirection | 'all'>('all')
  const { bookings, loading: bookingsLoading } = useBookings()
  const { transactions, loading: transactionsLoading } = useTransactions({
    startDate: dateRange?.[0]?.startOf('day').toDate() ?? null,
    endDate: dateRange?.[1]?.endOf('day').toDate() ?? null,
    type: typeFilter,
    direction: directionFilter,
  })

  const incomingTotal = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.direction === 'incoming')
        .reduce((total, transaction) => total + Math.max(Number(transaction.amount ?? 0), 0), 0),
    [transactions]
  )

  const outgoingTotal = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.direction === 'outgoing')
        .reduce((total, transaction) => total + Math.max(Number(transaction.amount ?? 0), 0), 0),
    [transactions]
  )

  const outstandingBalance = useMemo(
    () =>
      bookings.reduce((total, booking) => {
        if (booking.status === 'canceled') {
          return total
        }

        const fallbackRemaining = Number(booking.totalPrice ?? 0) - Number(booking.paidAmount ?? 0)
        return total + Math.max(Number(booking.remainingAmount ?? fallbackRemaining), 0)
      }, 0),
    [bookings]
  )

  const handleReset = () => {
    setDateRange(getCurrentMonthRange())
    setTypeFilter('all')
    setDirectionFilter('all')
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={t('finance.metrics.incoming')}
            value={<MoneyText value={incomingTotal} language={i18n.resolvedLanguage} />}
            hint={t('finance.metrics.incomingHint')}
            icon={<ArrowDownOutlined />}
          />
          <MetricCard
            label={t('finance.metrics.outgoing')}
            value={<MoneyText value={outgoingTotal} language={i18n.resolvedLanguage} />}
            hint={t('finance.metrics.outgoingHint')}
            icon={<ArrowUpOutlined />}
          />
          <MetricCard
            label={t('finance.metrics.outstanding')}
            value={<MoneyText value={outstandingBalance} language={i18n.resolvedLanguage} />}
            hint={t('finance.metrics.outstandingHint')}
            icon={<WalletOutlined />}
          />
          <MetricCard
            label={t('finance.metrics.count')}
            value={transactions.length}
            hint={t('finance.metrics.countHint')}
            icon={<NumberOutlined />}
          />
        </div>

      <SectionCard
        title={t('finance.page.directoryTitle')}
        description={t('finance.page.directoryDescription')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(value) => setDateRange(value && value[0] && value[1] ? [value[0], value[1]] : null)}
              className="w-full min-w-[220px] sm:w-auto"
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              className="min-w-[160px]"
              options={[
                { value: 'all', label: t('finance.filters.allTypes') },
                ...transactionTypes.map((type) => ({
                  value: type,
                  label: t(`bookings.transactions.types.${type}`),
                })),
              ]}
            />
            <Select
              value={directionFilter}
              onChange={setDirectionFilter}
              className="min-w-[150px]"
              options={[
                { value: 'all', label: t('finance.filters.allDirections') },
                { value: 'incoming', label: t('finance.filters.incoming') },
                { value: 'outgoing', label: t('finance.filters.outgoing') },
              ]}
            />
            <Button onClick={handleReset}>{t('finance.filters.reset')}</Button>
          </div>
        }
      >
        <TransactionList transactions={transactions} isLoading={transactionsLoading || bookingsLoading} />
      </SectionCard>
    </div>
  )
}
