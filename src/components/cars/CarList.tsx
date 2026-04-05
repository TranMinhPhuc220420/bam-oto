import { Button, Empty, Popconfirm, Space, Table, Tag, Typography } from 'antd'
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
