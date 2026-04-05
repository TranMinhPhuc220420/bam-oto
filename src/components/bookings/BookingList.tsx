import { Button, Empty, Grid, Popconfirm, Popover, Skeleton, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CalendarOutlined, CarOutlined, DeleteOutlined, DollarCircleOutlined, EditOutlined, EyeOutlined, PaperClipOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { canDeleteBooking } from '../../services/bookingService'
import { Booking, BookingStatus, PaymentStatus } from '../../types/Booking'
import type { UserRole } from '../../types/User'
import { formatCurrencyVnd } from '../../utils/currency'
import { BookingDocumentsPreview } from './BookingDocumentsPreview'
import { useNavigate } from 'react-router-dom'

interface BookingListProps {
  bookings: Booking[]
  isLoading: boolean
  onView: (booking: Booking) => void
  onEdit: (booking: Booking) => void
  onDelete: (booking: Booking) => void
  currentUserRole?: UserRole | null
  deletingBookingId?: string | null
}

const { Text } = Typography

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
  return Array.from(
    new Set([...(documentUrls ?? []), ...(documentUrl ? [documentUrl] : [])].filter(Boolean))
  )
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

function isOverdueBooking(booking: Booking) {
  const endDate = toDate(booking.endDate)

  return !!endDate && endDate.getTime() < Date.now() && !['completed', 'canceled'].includes(booking.status)
}

function formatDateTime(value: unknown, locale: string, compact = false) {
  const date = toDate(value)

  if (!date) {
    return '—'
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    ...(compact ? {} : { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function BookingList({
  bookings,
  isLoading,
  onView,
  onEdit,
  onDelete,
  currentUserRole,
  deletingBookingId,
}: BookingListProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-GB'

  const columns: ColumnsType<Booking> = [
    {
      title: t('bookings.list.booking'),
      key: 'booking',
      sorter: (a, b) => a.bookingCode.localeCompare(b.bookingCode),
      render: (_, record) => (
        <div className="space-y-1">
          {/* <Text strong className="text-slate-900">
            {record.bookingCode}
          </Text> */}
          {/* <Button type="link" className="px-0" onClick={() => navigate(`/bookings/${record.id}`)}>
            {record.bookingCode}
          </Button> */}
          {/* Link to page detail*/}
          <Text strong className="text-slate-900 cursor-pointer"
            onClick={() => navigate(`/bookings/${record.id}`)}
          >
            {record.bookingCode}
          </Text>
          <div className="text-sm text-slate-500">{record.customerSnapshot?.fullName}</div>
          {record.customerSnapshot?.phoneNumber ? (
            <div className="text-xs text-slate-400">{record.customerSnapshot.phoneNumber}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: t('bookings.list.car'),
      key: 'car',
      render: (_, record) => (
        <div className="space-y-1 text-sm text-slate-600">
          <div className="font-medium text-slate-900">{record.carSnapshot?.plateNumber}</div>
          <div>{[record.carSnapshot?.brand, record.carSnapshot?.model].filter(Boolean).join(' • ')}</div>
        </div>
      ),
    },
    {
      title: t('bookings.list.schedule'),
      key: 'schedule',
      sorter: (a, b) => (toDate(a.startDate)?.getTime() ?? 0) - (toDate(b.startDate)?.getTime() ?? 0),
      render: (_, record) => {
        const startDate = toDate(record.startDate)
        const endDate = toDate(record.endDate)

        const durationDays =
          startDate && endDate ? Math.max(1, Math.ceil(dayjs(endDate).diff(dayjs(startDate), 'day', true))) : null

        return (
          <div className="space-y-1 text-sm text-slate-600">
            <div>
              {startDate
                ? new Intl.DateTimeFormat(locale, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(startDate)
                : '—'}
            </div>
            <div className="text-slate-400">
              {endDate
                ? new Intl.DateTimeFormat(locale, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(endDate)
                : '—'}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {durationDays ? (
                <Text className="text-xs text-slate-500">
                  {t('bookings.list.durationDays', { count: durationDays })}
                </Text>
              ) : null}
              {isOverdueBooking(record) ? <Tag color="red">{t('bookings.list.overdue')}</Tag> : null}
            </div>
          </div>
        )
      },
    },
    {
      title: t('bookings.list.status'),
      key: 'status',
      dataIndex: 'status',
      render: (status: BookingStatus) => (
        <Tag color={statusColors[status]} className="rounded-full px-3 py-1 font-medium">
          {t(`bookings.status.${status}`)}
        </Tag>
      ),
      filters: Object.keys(statusColors).map((status) => ({
        text: t(`bookings.status.${status}`),
        value: status,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('bookings.list.payment'),
      key: 'paymentStatus',
      dataIndex: 'paymentStatus',
      render: (status: PaymentStatus, record) => (
        <div className="space-y-1">
          <Tag color={paymentColors[status]} className="rounded-full px-3 py-1 font-medium">
            {t(`bookings.paymentStatus.${status}`)}
          </Tag>
          <div className="text-xs text-slate-500">
            {t('bookings.list.remaining', {
              paid: formatCurrencyVnd(record.paidAmount ?? 0, i18n.resolvedLanguage),
              remaining: formatCurrencyVnd(
                record.remainingAmount ?? Math.max(record.totalPrice - (record.paidAmount ?? 0), 0),
                i18n.resolvedLanguage
              ),
            })}
          </div>
        </div>
      ),
    },
    {
      title: t('bookings.list.documents'),
      key: 'documents',
      align: 'center',
      render: (_, record) => {
        const documentUrls = getBookingDocumentUrls(record.documentUrls, record.documentUrl)

        if (!documentUrls.length) {
          return <Text className="text-sm text-slate-400">0</Text>
        }

        return (
          <Popover
            trigger="click"
            placement="left"
            content={<BookingDocumentsPreview urls={documentUrls} compact />}
          >
            <Button type="link" icon={<PaperClipOutlined />}>
              {documentUrls.length}
            </Button>
          </Popover>
        )
      },
    },
    {
      title: t('bookings.list.totalPrice'),
      key: 'totalPrice',
      dataIndex: 'totalPrice',
      align: 'right',
      sorter: (a, b) => a.totalPrice - b.totalPrice,
      render: (value: number) => formatCurrencyVnd(value ?? 0, i18n.resolvedLanguage),
    },
    {
      title: t('bookings.list.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => {
        const deleteState = canDeleteBooking(record, currentUserRole)

        return (
          <Space size="small">
            <Button icon={<EyeOutlined />} onClick={() => onView(record)}>
              {/* {t('common.actions.view')} */}
            </Button>
            <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
              {/* {t('common.actions.edit')} */}
            </Button>
            {currentUserRole === 'admin' ? (
              deleteState.allowed ? (
                <Popconfirm
                  title={t('bookings.delete.confirmTitle')}
                  description={t('bookings.delete.confirmDescription', { bookingCode: record.bookingCode })}
                  onConfirm={() => onDelete(record)}
                  okText={t('common.actions.delete')}
                  cancelText={t('common.actions.cancel')}
                >
                  <Button icon={<DeleteOutlined />} danger loading={deletingBookingId === record.id}>
                    {/* {t('common.actions.delete')} */}
                  </Button>
                </Popconfirm>
              ) : (
                <Tooltip title={t(deleteState.reasonKey ?? 'bookings.delete.blockedUnavailable')}>
                  <span>
                    <Button icon={<DeleteOutlined />} danger disabled>
                      {/* {t('common.actions.delete')} */}
                    </Button>
                  </span>
                </Tooltip>
              )
            ) : null}
          </Space>
        )
      },
    },
  ]

  if (isMobile) {
    if (isLoading) {
      return (
        <div className="mobile-card-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`booking-skeleton-${index}`}
              className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
            >
              <Skeleton active paragraph={{ rows: 4 }} title={{ width: '55%' }} />
            </div>
          ))}
        </div>
      )
    }

    if (!bookings.length) {
      return (
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('bookings.list.empty')} />
        </div>
      )
    }

    return (
      <div className="mobile-card-list gap-2.5">
        {bookings.map((record) => {
          const startDate = toDate(record.startDate)
          const endDate = toDate(record.endDate)
          const durationDays =
            startDate && endDate ? Math.max(1, Math.ceil(dayjs(endDate).diff(dayjs(startDate), 'day', true))) : null
          const documentUrls = getBookingDocumentUrls(record.documentUrls, record.documentUrl)
          const deleteState = canDeleteBooking(record, currentUserRole)
          const scheduleLabel = `${formatDateTime(record.startDate, locale, true)} → ${formatDateTime(record.endDate, locale, true)}`
          const carLabel = [record.carSnapshot?.plateNumber, record.carSnapshot?.brand, record.carSnapshot?.model]
            .filter(Boolean)
            .join(' • ')

          return (
            <article
              key={record.id ?? record.bookingCode}
              className="rounded-[20px] border border-slate-200/80 bg-white p-3.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="mobile-clamp-1 cursor-pointer bg-transparent text-left text-[15px] font-semibold text-slate-900 transition hover:text-teal-700"
                    onClick={() => navigate(`/bookings/${record.id}`)}
                  >
                    {record.bookingCode}
                  </button>
                  <div className="mobile-clamp-1 mt-0.5 text-sm text-slate-600">{record.customerSnapshot?.fullName ?? '—'}</div>
                  {record.customerSnapshot?.phoneNumber ? (
                    <div className="mobile-clamp-1 text-xs text-slate-400">{record.customerSnapshot.phoneNumber}</div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Tag color={statusColors[record.status]} className="m-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                    {t(`bookings.status.${record.status}`)}
                  </Tag>
                  <Tag color={paymentColors[record.paymentStatus]} className="m-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                    {t(`bookings.paymentStatus.${record.paymentStatus}`)}
                  </Tag>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <CarOutlined className="text-slate-400" />
                  <span className="mobile-clamp-1 max-w-[160px]">{carLabel || t('cars.list.missingBrandModel')}</span>
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5 text-slate-500">
                  <CalendarOutlined className="text-slate-400" />
                  <span className="mobile-clamp-1 max-w-[170px]">{scheduleLabel}</span>
                </span>
                {durationDays ? (
                  <Text className="text-xs text-slate-500">{t('bookings.list.durationDays', { count: durationDays })}</Text>
                ) : null}
                {isOverdueBooking(record) ? (
                  <Tag color="red" className="m-0 rounded-full px-2 py-0 text-[11px]">
                    {t('bookings.list.overdue')}
                  </Tag>
                ) : null}
                <div className="mt-2 text-[15px] font-semibold text-slate-900">
                  <div className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-slate-900">
                    <DollarCircleOutlined className="text-slate-400" />
                    {formatCurrencyVnd(record.totalPrice ?? 0, i18n.resolvedLanguage)}
                  </div>
                  <div className="mobile-clamp-1 mt-1 text-xs text-slate-500">
                    {t('bookings.list.remaining', {
                      paid: formatCurrencyVnd(record.paidAmount ?? 0, i18n.resolvedLanguage),
                      remaining: formatCurrencyVnd(
                        record.remainingAmount ?? Math.max(record.totalPrice - (record.paidAmount ?? 0), 0),
                        i18n.resolvedLanguage
                      ),
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-3">
                <div className="min-w-0 flex-1">
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {documentUrls.length ? (
                    <Popover
                      trigger="click"
                      placement="bottomRight"
                      content={<BookingDocumentsPreview urls={documentUrls} compact />}
                    >
                      <Button
                        type="default"
                        icon={<PaperClipOutlined />}
                        size="small"
                        aria-label={t('bookings.list.documents')}
                        className="h-8 rounded-full px-2"
                      >
                        {documentUrls.length}
                      </Button>
                    </Popover>
                  ) : null}

                  <Tooltip title={t('common.actions.view')}>
                    <Button
                      icon={<EyeOutlined />}
                      shape="circle"
                      size="small"
                      aria-label={t('common.actions.view')}
                      onClick={() => onView(record)}
                    />
                  </Tooltip>

                  <Tooltip title={t('common.actions.edit')}>
                    <Button
                      icon={<EditOutlined />}
                      shape="circle"
                      size="small"
                      aria-label={t('common.actions.edit')}
                      onClick={() => onEdit(record)}
                    />
                  </Tooltip>

                  {currentUserRole === 'admin' ? (
                    deleteState.allowed ? (
                      <Popconfirm
                        title={t('bookings.delete.confirmTitle')}
                        description={t('bookings.delete.confirmDescription', { bookingCode: record.bookingCode })}
                        onConfirm={() => onDelete(record)}
                        okText={t('common.actions.delete')}
                        cancelText={t('common.actions.cancel')}
                      >
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          shape="circle"
                          size="small"
                          aria-label={t('common.actions.delete')}
                          loading={deletingBookingId === record.id}
                        />
                      </Popconfirm>
                    ) : (
                      <Tooltip title={t(deleteState.reasonKey ?? 'bookings.delete.blockedUnavailable')}>
                        <span>
                          <Button icon={<DeleteOutlined />} danger size="small" disabled shape="circle" aria-label={t('common.actions.delete')} />
                        </span>
                      </Tooltip>
                    )
                  ) : null}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <Table
      className="data-table"
      columns={columns}
      dataSource={bookings}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
      scroll={{ x: 980 }}
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('bookings.list.empty')} />,
      }}
    />
  )
}
