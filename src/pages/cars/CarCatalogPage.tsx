import { useEffect, useMemo, useState } from 'react'
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
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
import { useCars } from '../../hooks/useCars'
import { useAuth } from '../../hooks/useAuth'
import {
  canDeleteCarBrand,
  canDeleteCarModel,
  deleteCarBrandWithGuards,
  deleteCarModelWithGuards,
  isCatalogDuplicateError,
  saveCarBrand,
  saveCarModel,
} from '../../services/carCatalog'
import { CarBrand } from '../../types/Brand'
import { CarModel } from '../../types/Model'

export function CarCatalogPage() {
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const { brands, loading: brandsLoading } = useCarBrands({ includeInactive: true })
  const { models, loading: modelsLoading } = useCarModels(undefined, { includeInactive: true })
  const { cars } = useCars()
  const { profile } = useAuth()
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>()
  const [mobileView, setMobileView] = useState<'brands' | 'models'>('brands')
  const [savingBrand, setSavingBrand] = useState(false)
  const [savingModel, setSavingModel] = useState(false)
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null)
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null)
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

  useEffect(() => {
    if (!isMobile || !selectedBrandId) {
      setMobileView('brands')
    }
  }, [isMobile, selectedBrandId])

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

  const handleSelectBrand = (brand: CarBrand) => {
    setSelectedBrandId(brand.id)

    if (isMobile) {
      setMobileView('models')
    }
  }

  const handleBackToBrands = () => {
    setMobileView('brands')
  }

  const getBrandDeleteState = (brand: CarBrand) =>
    canDeleteCarBrand(brand, cars, profile?.role ?? null)

  const getModelDeleteState = (model: CarModel) =>
    canDeleteCarModel(model, cars, {
      role: profile?.role ?? null,
      brand: brands.find((brand) => brand.id === model.brandId) ?? null,
    })

  const handleDeleteBrand = async (brand: CarBrand) => {
    const deleteState = getBrandDeleteState(brand)

    if (!deleteState.allowed) {
      message.warning(t(deleteState.reasonKey ?? 'brands.messages.deleteError'))
      return
    }

    setDeletingBrandId(brand.id ?? null)

    try {
      const result = await deleteCarBrandWithGuards(brand, profile?.role ?? null)

      if (!result.allowed) {
        message.warning(t(result.reasonKey ?? 'brands.messages.deleteError'))
        return
      }

      message.success(t('brands.messages.deleteSuccess'))
    } catch (error) {
      console.error('Error deleting car brand:', error)
      message.error(t('brands.messages.deleteError'))
    } finally {
      setDeletingBrandId(null)
    }
  }

  const handleDeleteModel = async (model: CarModel) => {
    const deleteState = getModelDeleteState(model)

    if (!deleteState.allowed) {
      message.warning(t(deleteState.reasonKey ?? 'models.messages.deleteError'))
      return
    }

    setDeletingModelId(model.id ?? null)

    try {
      const result = await deleteCarModelWithGuards(model, {
        role: profile?.role ?? null,
        brand: brands.find((brand) => brand.id === model.brandId) ?? null,
      })

      if (!result.allowed) {
        message.warning(t(result.reasonKey ?? 'models.messages.deleteError'))
        return
      }

      message.success(t('models.messages.deleteSuccess'))
    } catch (error) {
      console.error('Error deleting car model:', error)
      message.error(t('models.messages.deleteError'))
    } finally {
      setDeletingModelId(null)
    }
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

  const brandModal = (
    <Modal
      open={isBrandModalOpen}
      title={editingBrand ? t('brands.page.editModal') : t('brands.page.createModal')}
      onCancel={() => {
        setIsBrandModalOpen(false)
        setEditingBrand(null)
      }}
      footer={null}
      destroyOnHidden
      centered={!isMobile}
      width={isMobile ? 'calc(100vw - 24px)' : 560}
    >
      <BrandForm
        initialValues={editingBrand ?? undefined}
        onSubmit={(values) => {
          void handleBrandSubmit(values)
        }}
        isLoading={savingBrand}
      />
    </Modal>
  )

  const modelModal = (
    <Modal
      open={isModelModalOpen}
      title={editingModel ? t('models.page.editModal') : t('models.page.createModal')}
      onCancel={() => {
        setIsModelModalOpen(false)
        setEditingModel(null)
      }}
      footer={null}
      destroyOnHidden
      centered={!isMobile}
      width={isMobile ? 'calc(100vw - 24px)' : 560}
    >
      <ModelForm
        initialValues={editingModel ?? { brandId: selectedBrandId, isActive: true }}
        onSubmit={(values) => {
          void handleModelSubmit(values)
        }}
        isLoading={savingModel}
      />
    </Modal>
  )

  if (isMobile) {
    const showModelPanel = mobileView === 'models' && Boolean(selectedBrandId)

    return (
      <div className="mobile-safe-bottom space-y-4">
        {showModelPanel ? (
          <SectionCard
            title={selectedBrandName ?? t('catalog.page.modelSectionTitle')}
            description={
              selectedBrandName
                ? t('catalog.page.modelSectionSelectedDescription', { brand: selectedBrandName })
                : t('catalog.page.modelSectionDescription')
            }
            actions={
              <div className="flex w-full items-center gap-2">
                <Button icon={<ArrowLeftOutlined />} size='small' className="rounded-full" onClick={handleBackToBrands}>
                  {t('common.actions.back')}
                </Button>
                <Button
                  type="primary"
                  size='small'
                  icon={<PlusOutlined />}
                  className="flex-1 rounded-full"
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
              loading={modelsLoading}
              onEdit={openEditModelModal}
              onDelete={handleDeleteModel}
              deletingId={deletingModelId}
              getDeleteState={getModelDeleteState}
            />
          </SectionCard>
        ) : (
          <SectionCard
            title={t('catalog.page.brandSectionTitle')}
            description={t('catalog.page.brandSectionDescription')}
            actions={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size='small'
                block
                className="rounded-full"
                onClick={openCreateBrandModal}
              >
                {t('brands.page.add')}
              </Button>
            }
          >
            <BrandList
              brands={brands}
              loading={brandsLoading}
              onEdit={openEditBrandModal}
              onDelete={handleDeleteBrand}
              deletingId={deletingBrandId}
              getDeleteState={getBrandDeleteState}
              selectedBrandId={selectedBrandId}
              onSelectBrand={handleSelectBrand}
            />
          </SectionCard>
        )}

        {brandModal}
        {modelModal}
      </div>
    )
  }

  return (
    <div className="mobile-safe-bottom space-y-4 sm:space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
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
        <div className="col-span-2 md:col-span-1">
          <MetricCard
            label={t('models.metrics.total')}
            value={models.length}
            hint={t('catalog.page.totalModelsHint')}
            icon={<ApartmentOutlined />}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:gap-5">
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
            loading={brandsLoading}
            onEdit={openEditBrandModal}
            onDelete={handleDeleteBrand}
            deletingId={deletingBrandId}
            getDeleteState={getBrandDeleteState}
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
            <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
              <BrandSelector
                includeInactive
                allowClear
                value={selectedBrandId}
                onChange={(value) => setSelectedBrandId(value)}
                className="w-full min-w-0 sm:min-w-[220px]"
                placeholder={t('catalog.page.filterPlaceholder')}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                className="rounded-full px-6 sm:w-auto"
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
            loading={modelsLoading}
            onEdit={openEditModelModal}
            onDelete={handleDeleteModel}
            deletingId={deletingModelId}
            getDeleteState={getModelDeleteState}
          />
        </SectionCard>
      </div>

      {brandModal}
      {modelModal}
    </div>
  )
}
