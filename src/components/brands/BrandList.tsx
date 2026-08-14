import type { MouseEvent } from 'react'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Empty, Grid, Popconfirm, Skeleton, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'

import type { CatalogDeleteEligibilityResult } from '../../services/carCatalog'
import { CarBrand } from '../../types/Brand'
import { EmptyCopy } from '../ui/EmptyCopy'

interface BrandListProps {
  brands: CarBrand[]
  loading: boolean
  onEdit: (brand: CarBrand) => void
  onDelete?: (brand: CarBrand) => void
  deletingId?: string | null
  getDeleteState?: (brand: CarBrand) => CatalogDeleteEligibilityResult
  selectedBrandId?: string
  onSelectBrand?: (brand: CarBrand) => void
}

const { Text } = Typography

function stopRowClick(event: MouseEvent) {
  event.stopPropagation()
}

export function BrandList({
  brands,
  loading,
  onEdit,
  onDelete,
  deletingId,
  getDeleteState,
  selectedBrandId,
  onSelectBrand,
}: BrandListProps) {
  const { t } = useTranslation()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false

  const renderDeleteControl = (brand: CarBrand) => {
    if (!onDelete) {
      return null
    }

    const deleteState = getDeleteState?.(brand) ?? { allowed: true }
    const button = (
      <Button
        icon={<DeleteOutlined />}
        size="small"
        danger
        shape="circle"
        disabled={!deleteState.allowed}
        loading={Boolean(brand.id && deletingId === brand.id)}
        aria-label={t('common.actions.delete')}
        onClick={stopRowClick}
      />
    )

    if (!deleteState.allowed) {
      return (
        <Tooltip title={t(deleteState.reasonKey ?? 'brands.messages.deleteError')}>
          <span onClick={stopRowClick}>{button}</span>
        </Tooltip>
      )
    }

    return (
      <span onClick={stopRowClick}>
        <Popconfirm
          title={t('brands.messages.deleteTitle')}
          description={t('brands.messages.deleteDescription', { name: brand.name })}
          onConfirm={() => onDelete(brand)}
          okText={t('common.actions.delete')}
          cancelText={t('common.actions.cancel')}
          okButtonProps={{ danger: true }}
        >
          {button}
        </Popconfirm>
      </span>
    )
  }

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
        <Space size="small" onClick={stopRowClick}>
          <Tooltip title={t('common.actions.edit')}>
            <Button
              icon={<EditOutlined />}
              size="small"
              shape="circle"
              aria-label={t('common.actions.edit')}
              onClick={(event) => {
                stopRowClick(event)
                onEdit(record)
              }}
            />
          </Tooltip>
          {renderDeleteControl(record)}
        </Space>
      ),
    },
  ]

  if (isMobile) {
    if (loading) {
      return (
        <div className="mobile-card-list gap-2.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`brand-skeleton-${index}`}
              className="rounded-[20px] border border-slate-200/80 bg-white p-3.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)]"
            >
              <Skeleton active paragraph={{ rows: 3 }} title={{ width: '50%' }} />
            </div>
          ))}
        </div>
      )
    }

    if (!brands.length) {
      return (
        <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<EmptyCopy title={t('brands.list.empty')} hint={t('brands.list.emptyHint')} />} />
        </div>
      )
    }

    return (
      <div className="mobile-card-list gap-2.5">
        {brands.map((brand) => {
          const isSelected = Boolean(brand.id && brand.id === selectedBrandId)
          const isActive = brand.isActive !== false

          return (
            <article
              key={brand.id ?? brand.name}
              className={[
                'rounded-[20px] border bg-white p-3.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.42)] transition',
                isSelected ? 'border-teal-200 bg-teal-50/60' : 'border-slate-200/80',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="mobile-clamp-1 cursor-pointer bg-transparent text-left text-[15px] font-semibold text-slate-900 transition hover:text-teal-700"
                    onClick={() => onSelectBrand?.(brand)}
                  >
                    {brand.name}
                  </button>
                  <p className="mb-0 mt-1 text-sm leading-5 text-slate-500">{t('brands.list.helper')}</p>
                </div>

                <div className="flex shrink-0 items-start gap-2">
                  <div className="flex flex-col items-end gap-1">
                    <Tag color={isActive ? 'green' : 'default'} className="m-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                      {isActive ? t('common.states.active') : t('common.states.inactive')}
                    </Tag>
                    {isSelected ? (
                      <Tag color="cyan" className="m-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                        {t('common.states.selected')}
                      </Tag>
                    ) : null}
                  </div>
                  {renderDeleteControl(brand)}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-slate-200/70 pt-3">
                {onSelectBrand ? (
                  <Button
                    type={isSelected ? 'primary' : 'default'}
                    className="flex-1 rounded-full"
                    onClick={() => onSelectBrand(brand)}
                  >
                    {isSelected ? t('common.states.selected') : t('common.actions.select')}
                  </Button>
                ) : null}
                <Button
                  icon={<EditOutlined />}
                  className={onSelectBrand ? 'flex-1 rounded-full' : 'w-full rounded-full'}
                  onClick={() => onEdit(brand)}
                >
                  {t('common.actions.edit')}
                </Button>
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
      dataSource={brands}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
      scroll={{ x: 680 }}
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
            description={<EmptyCopy title={t('brands.list.empty')} hint={t('brands.list.emptyHint')} />}
          />
        ),
      }}
    />
  )
}
