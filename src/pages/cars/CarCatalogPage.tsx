import { useEffect, useMemo, useState } from 'react'
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { App, Button, Grid, Modal } from 'antd'
import { useTranslation } from 'react-i18next'

import { BrandForm, type BrandFormValues } from '../../components/brands/BrandForm'
import { BrandList } from '../../components/brands/BrandList'
import { BrandSelector } from '../../components/cars/BrandSelector'
import { ModelForm, type ModelFormValues } from '../../components/models/ModelForm'
import { ModelList } from '../../components/models/ModelList'
import { MetricCard } from '../../components/ui/MetricCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { useCarBrands } from '../../hooks/useCarBrands'
import { useCarModels } from '../../hooks/useCarModels'
import { isCatalogDuplicateError, saveCarBrand, saveCarModel } from '../../services/carCatalog'
import { CarBrand } from '../../types/Brand'
import { CarModel } from '../../types/Model'

export function CarCatalogPage() {
  const screens = Grid.useBreakpoint()
  const { brands, loading: brandsLoading } = useCarBrands({ includeInactive: true })
  const { models, loading: modelsLoading } = useCarModels(undefined, { includeInactive: true })
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>()
  const [savingBrand, setSavingBrand] = useState(false)
  const [savingModel, setSavingModel] = useState(false)
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [isModelModalOpen, setIsModelModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<CarBrand | null>(null)
  const [editingModel, setEditingModel] = useState<CarModel | null>(null)
  const { t } = useTranslation()
  const { message } = App.useApp()

  useEffect(() => {
    if (!brands.length) {
      setSelectedBrandId(undefined)
      return
    }

    const stillExists = brands.some((brand) => brand.id === selectedBrandId)

    if (!selectedBrandId || !stillExists) {
      setSelectedBrandId(brands.find((brand) => brand.id)?.id)
    }
  }, [brands, selectedBrandId])

  const brandNames = useMemo(
    () =>
      brands.reduce<Record<string, string>>((accumulator, brand) => {
        if (brand.id) {
          accumulator[brand.id] = brand.name
        }

        return accumulator
      }, {}),
    [brands]
  )

  const filteredModels = useMemo(
    () => (selectedBrandId ? models.filter((model) => model.brandId === selectedBrandId) : models),
    [models, selectedBrandId]
  )

  const activeBrandCount = useMemo(() => brands.filter((brand) => brand.isActive !== false).length, [brands])
  const selectedBrandName = selectedBrandId ? brandNames[selectedBrandId] : undefined
  const loading = brandsLoading || modelsLoading

  const openCreateBrandModal = () => {
    setEditingBrand(null)
    setIsBrandModalOpen(true)
  }

  const openEditBrandModal = (brand: CarBrand) => {
    setEditingBrand(brand)
    setSelectedBrandId(brand.id)
    setIsBrandModalOpen(true)
  }

  const openCreateModelModal = () => {
    setEditingModel(null)
    setIsModelModalOpen(true)
  }

  const openEditModelModal = (model: CarModel) => {
    setEditingModel(model)
    setSelectedBrandId(model.brandId)
    setIsModelModalOpen(true)
  }

  const handleBrandSubmit = async (values: BrandFormValues) => {
    setSavingBrand(true)

    try {
      const savedBrand = await saveCarBrand(values, editingBrand?.id)
      setSelectedBrandId(savedBrand.id)
      message.success(
        t(editingBrand?.id ? 'brands.messages.updated' : 'brands.messages.created')
      )
      setIsBrandModalOpen(false)
      setEditingBrand(null)
    } catch (error) {
      console.error('Error saving car brand:', error)
      message.error(
        isCatalogDuplicateError(error, 'catalog/brand-duplicate')
          ? t('brands.messages.duplicate')
          : t('brands.messages.saveError')
      )
    } finally {
      setSavingBrand(false)
    }
  }

  const handleModelSubmit = async (values: ModelFormValues) => {
    setSavingModel(true)

    try {
      const savedModel = await saveCarModel(values, editingModel?.id)
      setSelectedBrandId(savedModel.brandId)
      message.success(
        t(editingModel?.id ? 'models.messages.updated' : 'models.messages.created')
      )
      setIsModelModalOpen(false)
      setEditingModel(null)
    } catch (error) {
      console.error('Error saving car model:', error)
      message.error(
        isCatalogDuplicateError(error, 'catalog/model-duplicate')
          ? t('models.messages.duplicate')
          : t('models.messages.saveError')
      )
    } finally {
      setSavingModel(false)
    }
  }

  return (
    <div className="space-y-5">
      {(screens.md || screens.lg) && (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label={t('brands.metrics.total')}
            value={brands.length}
            hint={t('catalog.page.totalBrandsHint')}
            icon={<TagsOutlined />}
          />
          <MetricCard
            label={t('brands.metrics.active')}
            value={activeBrandCount}
            hint={t('catalog.page.activeBrandsHint')}
            icon={<CheckCircleOutlined />}
          />
          <MetricCard
            label={t('models.metrics.total')}
            value={models.length}
            hint={t('catalog.page.totalModelsHint')}
            icon={<ApartmentOutlined />}
          />
        </div>
      )}


      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <SectionCard
          title={t('catalog.page.brandSectionTitle')}
          description={t('catalog.page.brandSectionDescription')}
          actions={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="rounded-full px-6"
              onClick={openCreateBrandModal}
            >
              {t('brands.page.add')}
            </Button>
          }
        >
          <BrandList
            brands={brands}
            loading={loading}
            onEdit={openEditBrandModal}
            selectedBrandId={selectedBrandId}
            onSelectBrand={(brand) => setSelectedBrandId(brand.id)}
          />
        </SectionCard>

        <SectionCard
          title={t('catalog.page.modelSectionTitle')}
          description={
            selectedBrandName
              ? t('catalog.page.modelSectionSelectedDescription', { brand: selectedBrandName })
              : t('catalog.page.modelSectionDescription')
          }
          actions={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <BrandSelector
                includeInactive
                allowClear
                value={selectedBrandId}
                onChange={(value) => setSelectedBrandId(value)}
                className="min-w-[220px]"
                placeholder={t('catalog.page.filterPlaceholder')}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                className="rounded-full px-6"
                onClick={openCreateModelModal}
                disabled={!brands.length}
              >
                {t('models.page.add')}
              </Button>
            </div>
          }
        >
          <ModelList
            models={filteredModels}
            brandNames={brandNames}
            loading={loading}
            onEdit={openEditModelModal}
          />
        </SectionCard>
      </div>

      <Modal
        open={isBrandModalOpen}
        title={editingBrand ? t('brands.page.editModal') : t('brands.page.createModal')}
        onCancel={() => {
          setIsBrandModalOpen(false)
          setEditingBrand(null)
        }}
        footer={null}
        destroyOnHidden
        centered
        width={560}
      >
        <BrandForm
          initialValues={editingBrand ?? undefined}
          onSubmit={(values) => {
            void handleBrandSubmit(values)
          }}
          isLoading={savingBrand}
        />
      </Modal>

      <Modal
        open={isModelModalOpen}
        title={editingModel ? t('models.page.editModal') : t('models.page.createModal')}
        onCancel={() => {
          setIsModelModalOpen(false)
          setEditingModel(null)
        }}
        footer={null}
        destroyOnHidden
        centered
        width={560}
      >
        <ModelForm
          initialValues={editingModel ?? { brandId: selectedBrandId, isActive: true }}
          onSubmit={(values) => {
            void handleModelSubmit(values)
          }}
          isLoading={savingModel}
        />
      </Modal>
    </div>
  )
}
