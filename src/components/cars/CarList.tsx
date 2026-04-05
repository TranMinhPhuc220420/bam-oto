import { Button, Empty, Grid, Popconfirm, Skeleton, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
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
          <Text strong className="text-slate-900">
            {record.plateNumber}
          </Text>
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
      render: (_, record) => {
        const activeBooking = record.id ? activeBookingByCarId[record.id] : undefined

        if (record.status !== 'rented') {
          return <Text className="text-slate-400">—</Text>
        }

        if (!activeBooking?.id) {
          return <Text className="text-sm text-amber-700">{t('cars.list.noCurrentBooking')}</Text>
        }

        return (
          <Button type="link" className="px-0" onClick={() => navigate(`/bookings/${activeBooking.id}`)}>
            {activeBooking.bookingCode}
          </Button>
        )
      },
    },
    {
      title: t('cars.list.actions'),
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
            {t('common.actions.edit')}
          </Button>
          <Popconfirm
            title={t('cars.list.deleteTitle')}
            description={t('cars.list.deleteDescription')}
            onConfirm={() => onDelete(record.id as string)}
            okText={t('common.actions.delete')}
            cancelText={t('common.actions.cancel')}
          >
            <Button icon={<DeleteOutlined />} danger>
              {t('common.actions.delete')}
            </Button>
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
      <div className="mobile-card-list">
        {cars.map((record) => {
          const activeBooking = record.id ? activeBookingByCarId[record.id] : undefined

          return (
            <article
              key={record.id ?? record.plateNumber}
              className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
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
                    <div className="min-w-0">
                      <Text strong className="mobile-clamp-1 text-slate-900">
                        {record.plateNumber}
                      </Text>
                      <div className="mobile-clamp-2 text-sm text-slate-500">
                        {[record.brand, record.model].filter(Boolean).join(' • ') || t('cars.list.missingBrandModel')}
                      </div>
                    </div>

                    <Tag color={statusColors[record.status]} className="m-0 rounded-full px-3 py-1 font-medium">
                      {t(`cars.list.statusLabels.${record.status}`)}
                    </Tag>
                  </div>

                  <div className="mt-2 text-sm text-slate-600">
                    {record.year} • {record.fuelType === 'Gas' ? t('cars.list.fuel.gas') : t('cars.list.fuel.electric')}
                  </div>
                  <div className="text-xs text-slate-500">{record.color}</div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {t('cars.list.currentBooking')}
                </div>
                {record.status !== 'rented' ? (
                  <Text className="text-slate-400">—</Text>
                ) : !activeBooking?.id ? (
                  <Text className="text-sm text-amber-700">{t('cars.list.noCurrentBooking')}</Text>
                ) : (
                  <Button type="link" className="px-0" onClick={() => navigate(`/bookings/${activeBooking.id}`)}>
                    {activeBooking.bookingCode}
                  </Button>
                )}
              </div>

              <div className="mobile-action-group mt-3">
                <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
                  {t('common.actions.edit')}
                </Button>
                <Popconfirm
                  title={t('cars.list.deleteTitle')}
                  description={t('cars.list.deleteDescription')}
                  onConfirm={() => onDelete(record.id as string)}
                  okText={t('common.actions.delete')}
                  cancelText={t('common.actions.cancel')}
                >
                  <Button icon={<DeleteOutlined />} danger>
                    {t('common.actions.delete')}
                  </Button>
                </Popconfirm>
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
