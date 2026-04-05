import { EditOutlined } from '@ant-design/icons'
import { Button, Empty, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'

import { CarBrand } from '../../types/Brand'

interface BrandListProps {
  brands: CarBrand[]
  loading: boolean
  onEdit: (brand: CarBrand) => void
  selectedBrandId?: string
  onSelectBrand?: (brand: CarBrand) => void
}

const { Text } = Typography

export function BrandList({
  brands,
  loading,
  onEdit,
  selectedBrandId,
  onSelectBrand,
}: BrandListProps) {
  const { t } = useTranslation()

  const columns: ColumnsType<CarBrand> = [
    {
      title: t('brands.list.brand'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <div className="space-y-1">
          <Text strong className="text-slate-900">
            {name}
          </Text>
          <div className="text-sm text-slate-500">{t('brands.list.helper')}</div>
        </div>
      ),
    },
    {
      title: t('brands.list.status'),
      key: 'isActive',
      dataIndex: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'} className="rounded-full px-3 py-1 font-medium">
          {isActive ? t('common.states.active') : t('common.states.inactive')}
        </Tag>
      ),
    },
    {
      title: t('brands.list.actions'),
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEdit(record)}>
            {t('common.actions.edit')}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Table
      className="data-table"
      columns={columns}
      dataSource={brands}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
      rowClassName={(record) =>
        record.id === selectedBrandId ? 'bg-teal-50/70' : onSelectBrand ? 'cursor-pointer' : ''
      }
      onRow={(record) => ({
        onClick: () => onSelectBrand?.(record),
      })}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('brands.list.empty')}
          />
        ),
      }}
    />
  )
}
