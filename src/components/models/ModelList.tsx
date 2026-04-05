import { EditOutlined } from '@ant-design/icons'
import { Button, Empty, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'

import { CarModel } from '../../types/Model'

interface ModelListProps {
  models: CarModel[]
  brandNames: Record<string, string>
  loading: boolean
  onEdit: (model: CarModel) => void
}

const { Text } = Typography

export function ModelList({ models, brandNames, loading, onEdit }: ModelListProps) {
  const { t } = useTranslation()

  const columns: ColumnsType<CarModel> = [
    {
      title: t('models.list.model'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <Text strong className="text-slate-900">
          {name}
        </Text>
      ),
    },
    {
      title: t('models.list.brand'),
      key: 'brandId',
      render: (_, record) => (
        <div className="text-sm text-slate-600">{brandNames[record.brandId] ?? t('models.list.unknownBrand')}</div>
      ),
    },
    {
      title: t('models.list.status'),
      key: 'isActive',
      dataIndex: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'} className="rounded-full px-3 py-1 font-medium">
          {isActive ? t('common.states.active') : t('common.states.inactive')}
        </Tag>
      ),
    },
    {
      title: t('models.list.actions'),
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
      dataSource={models}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('models.list.empty')}
          />
        ),
      }}
    />
  )
}
