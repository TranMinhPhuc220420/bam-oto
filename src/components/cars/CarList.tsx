import { BgColorsOutlined, CalendarOutlined, DeleteOutlined, EditOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Empty, Grid, Popconfirm, Skeleton, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Car, CarStatus } from '../../types/Car'

interface ActiveBookingSummary {
  id: string
  bookingCode: string
}

interface CarListProps {
  cars: Car[]
  isLoading: boolean
  activeBookingByCarId?: Record<string, ActiveBookingSummary>
  onEdit: (car: Car) => void
  onDelete: (carId: string) => void
}

const { Text } = Typography

const statusColors: Record<CarStatus, string> = {
  available: 'green',
  rented: 'blue',
  cleaning: 'orange',
  repair: 'red',
}

export function CarList({ cars, isLoading, activeBookingByCarId = {}, onEdit, onDelete }: CarListProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false

  const renderCurrentBookingContent = (record: Car, compact = false) => {
    const activeBooking = record.id ? activeBookingByCarId[record.id] : undefined

    if (record.status !== 'rented') {
      return <Text className="text-slate-400">—</Text>
    }

    if (!activeBooking?.id) {
      return (
        <Text className={compact ? 'text-xs text-amber-700' : 'text-sm text-amber-700'}>
          {t('cars.list.noCurrentBooking')}
        </Text>
      )
    }

    return (
      <Button
        type="link"
        size={compact ? 'small' : 'middle'}
        className="px-0"
        onClick={() => navigate(`/bookings/${activeBooking.id}`)}
      >
        {activeBooking.bookingCode}
      </Button>
    )
  }

  const columns: ColumnsType<Car> = [
    // Image
    {
      title: t('cars.list.image'),
      key: 'image',
      width: 100,
      render: (_, record) => (
        <div className="h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
          {record.images[0] ? (
            <img
              src={record.images[0]}
              alt={record.plateNumber}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              {t('cars.list.noImage')}
            </div>
          )}
        </div>
      ),
    },
    // Name & Brand
    {
      title: t('cars.list.vehicle'),
      key: 'vehicle',
      sorter: (a, b) => a.plateNumber.localeCompare(b.plateNumber),
      render: (_, record) => (
        <div className="space-y-1">
          <button
            type="button"
            className="cursor-pointer bg-transparent p-0 text-left text-sm font-semibold text-slate-900 transition hover:text-teal-700"
            onClick={() => onEdit(record)}
          >
            {record.plateNumber}
          </button>
          <div className="text-sm text-slate-500">
            {[record.brand, record.model].filter(Boolean).join(' • ') || t('cars.list.missingBrandModel')}
          </div>
        </div>
      ),
    },
    {
      title: t('cars.list.specs'),
      key: 'specs',
      render: (_, record) => (
        <div className="space-y-1 text-sm text-slate-600">
          <div>
            {record.year} • {record.fuelType === 'Gas' ? t('cars.list.fuel.gas') : t('cars.list.fuel.electric')}
          </div>
          <div className="text-slate-400">{record.color}</div>
        </div>
      ),
    },
    {
      title: t('cars.list.status'),
      key: 'status',
      dataIndex: 'status',
      render: (status: CarStatus) => (
        <Tag color={statusColors[status]} className="rounded-full px-3 py-1 font-medium">
          {t(`cars.list.statusLabels.${status}`)}
        </Tag>
      ),
      filters: [
        { text: t('cars.list.statusLabels.available'), value: 'available' },
        { text: t('cars.list.statusLabels.rented'), value: 'rented' },
        { text: t('cars.list.statusLabels.cleaning'), value: 'cleaning' },
        { text: t('cars.list.statusLabels.repair'), value: 'repair' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('cars.list.currentBooking'),
      key: 'currentBooking',
      render: (_, record) => renderCurrentBookingContent(record),
    },
    {
      title: t('cars.list.actions'),
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.actions.edit')}>
            <Button
              icon={<EditOutlined />}
              size='small'
              shape="circle"
              aria-label={t('common.actions.edit')}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t('cars.list.deleteTitle')}
            description={t('cars.list.deleteDescription')}
            onConfirm={() => onDelete(record.id as string)}
            okText={t('common.actions.delete')}
            cancelText={t('common.actions.cancel')}
          >
            <Button icon={<DeleteOutlined />} size='small' danger shape="circle" aria-label={t('common.actions.delete')} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  if (isMobile) {
    if (isLoading) {
      return (
        <div className="mobile-card-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`car-skeleton-${index}`}
              className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
            >
              <Skeleton active avatar paragraph={{ rows: 3 }} title={{ width: '50%' }} />
            </div>
          ))}
        </div>
      )
    }

    if (!cars.length) {
      return (
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('cars.list.empty')} />
        </div>
      )
    }

    return (
      <div className="mobile-card-list gap-2.5">
        {cars.map((record) => {
          const brandModelLabel =
            [record.brand, record.model].filter(Boolean).join(' • ') || t('cars.list.missingBrandModel')
          const fuelLabel = record.fuelType === 'Gas' ? t('cars.list.fuel.gas') : t('cars.list.fuel.electric')

          return (
            <article
              key={record.id ?? record.plateNumber}
              className="rounded-[20px] border border-slate-200/80 bg-white p-3.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
            >
              <div className="flex items-start gap-3">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {record.images[0] ? (
                    <img src={record.images[0]} alt={record.plateNumber} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-slate-400">
                      {t('cars.list.noImage')}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="mobile-clamp-1 cursor-pointer bg-transparent text-left text-[15px] font-semibold text-slate-900 transition hover:text-teal-700"
                        onClick={() => onEdit(record)}
                      >
                        {record.plateNumber}
                      </button>
                      <div className="mobile-clamp-1 mt-0.5 text-sm text-slate-600">{brandModelLabel}</div>
                    </div>

                    <Tag color={statusColors[record.status]} className="m-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                      {t(`cars.list.statusLabels.${record.status}`)}
                    </Tag>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarOutlined className="text-slate-400" />
                      <span>{record.year}</span>
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <ThunderboltOutlined className="text-slate-400" />
                      <span className="mobile-clamp-1 max-w-[120px]">{fuelLabel}</span>
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-slate-500">
                      <BgColorsOutlined className="text-slate-400" />
                      <span className="mobile-clamp-1 max-w-[110px]">{record.color}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t('cars.list.currentBooking')}
                  </div>
                  <div className="mobile-clamp-1">{renderCurrentBookingContent(record, true)}</div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Tooltip title={t('common.actions.edit')}>
                    <Button
                      icon={<EditOutlined />}
                      shape="circle"
                      size="small"
                      aria-label={t('common.actions.edit')}
                      onClick={() => onEdit(record)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title={t('cars.list.deleteTitle')}
                    description={t('cars.list.deleteDescription')}
                    onConfirm={() => onDelete(record.id as string)}
                    okText={t('common.actions.delete')}
                    cancelText={t('common.actions.cancel')}
                  >
                    <Button
                      icon={<DeleteOutlined />}
                      danger
                      shape="circle"
                      size="small"
                      aria-label={t('common.actions.delete')}
                    />
                  </Popconfirm>
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
      dataSource={cars}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
      scroll={{ x: 920 }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('cars.list.empty')}
          />
        ),
      }}
    />
  )
}
