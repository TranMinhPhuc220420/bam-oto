import { EditOutlined } from '@ant-design/icons'
import { Button, Empty, Grid, Skeleton, Space, Table, Tag, Typography } from 'antd'
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
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const showBrandLabel = new Set(models.map((model) => brandNames[model.brandId] ?? model.brandId)).size > 1

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

  if (isMobile) {
    if (loading) {
      return (
        <div className="mobile-card-list gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`model-skeleton-${index}`}
              className="rounded-[16px] border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
            >
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: '42%' }} />
            </div>
          ))}
        </div>
      )
    }

    if (!models.length) {
      return (
        <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('models.list.empty')} />
        </div>
      )
    }

    return (
      <div className="mobile-card-list gap-2">
        {models.map((model) => {
          const isActive = model.isActive !== false
          const brandLabel = brandNames[model.brandId] ?? t('models.list.unknownBrand')

          return (
            <article
              key={model.id ?? `${model.brandId}-${model.name}`}
              className="rounded-[16px] border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mobile-clamp-1 text-[15px] font-semibold text-slate-900">{model.name}</div>
                  {showBrandLabel ? <div className="mobile-clamp-1 mt-0.5 text-xs text-slate-500">{brandLabel}</div> : null}
                </div>

                <Tag color={isActive ? 'green' : 'default'} className="m-0 rounded-full px-2 py-0.5 text-[10px] font-medium">
                  {isActive ? t('common.states.active') : t('common.states.inactive')}
                </Tag>

                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  icon={<EditOutlined />}
                  aria-label={t('common.actions.edit')}
                  onClick={() => onEdit(model)}
                />
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
      dataSource={models}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
      scroll={{ x: 680 }}
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
