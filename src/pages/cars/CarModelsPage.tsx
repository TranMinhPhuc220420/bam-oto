import { useMemo, useState } from 'react'
import { ApartmentOutlined, CheckCircleOutlined, PlusOutlined, TagsOutlined } from '@ant-design/icons'
import { App, Button, Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { ModelForm, type ModelFormValues } from '../../components/models/ModelForm'
import { ModelList } from '../../components/models/ModelList'
import { MetricCard } from '../../components/ui/MetricCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { useCarBrands } from '../../hooks/useCarBrands'
import { useCarModels } from '../../hooks/useCarModels'
import { db } from '../../services/firebase'
import { CarBrand } from '../../types/Brand'
import { CarModel } from '../../types/Model'

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function CarModelsPage() {
  const { brands, loading: brandsLoading } = useCarBrands({ includeInactive: true })
  const { models, loading: modelsLoading } = useCarModels(undefined, { includeInactive: true })
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<CarModel | null>(null)
  const { t } = useTranslation()
  const { message } = App.useApp()

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

  const activeModelCount = useMemo(
    () => models.filter((model) => model.isActive !== false).length,
    [models]
  )

  const linkedBrandCount = useMemo(
    () => new Set(models.map((model) => model.brandId).filter(Boolean)).size,
    [models]
  )

  const openCreateModal = () => {
    setEditingModel(null)
    setIsModalOpen(true)
  }

  const openEditModal = (model: CarModel) => {
    setEditingModel(model)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setEditingModel(null)
    setIsModalOpen(false)
  }

  const handleSubmit = async (values: ModelFormValues) => {
    setSaving(true)

    try {
      const normalizedName = normalizeName(values.name)
      const duplicateSnapshot = await getDocs(
        query(
          collection(db, 'carModels'),
          where('brandId', '==', values.brandId),
          where('normalizedName', '==', normalizedName)
        )
      )
      const hasDuplicate = duplicateSnapshot.docs.some((modelDoc) => modelDoc.id !== editingModel?.id)

      if (hasDuplicate) {
        message.error(t('models.messages.duplicate'))
        return
      }

      const payload = {
        brandId: values.brandId,
        name: values.name,
        normalizedName,
        isActive: values.isActive,
        updatedAt: serverTimestamp(),
      }

      if (editingModel?.id) {
        await updateDoc(doc(db, 'carModels', editingModel.id), payload)
        message.success(t('models.messages.updated'))
      } else {
        await addDoc(collection(db, 'carModels'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
        message.success(t('models.messages.created'))
      }

      closeModal()
    } catch (error) {
      console.error('Error saving car model:', error)
      message.error(t('models.messages.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const loading = brandsLoading || modelsLoading
  const hasBrands = brands.some((brand: CarBrand) => brand.isActive !== false)

  return (
    <div className="space-y-5">
      {/* <section className="flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.35)] sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="mb-0 text-[11px] font-semibold uppercase tracking-[0.26em] text-teal-700">
            {t('models.page.eyebrow')}
          </p>
          <h2 className="mb-0 text-2xl font-semibold text-slate-900">{t('models.page.title')}</h2>
          <p className="mb-0 max-w-3xl text-sm text-slate-600 sm:text-base">
            {t('models.page.description')}
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          disabled={!hasBrands}
          size="large"
          className="rounded-full px-6 sm:self-start"
        >
          {t('models.page.add')}
        </Button>
      </section> */}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label={t('models.metrics.total')}
          value={models.length}
          hint={t('models.metrics.totalHint')}
          icon={<ApartmentOutlined />}
        />
        <MetricCard
          label={t('models.metrics.active')}
          value={activeModelCount}
          hint={t('models.metrics.activeHint')}
          icon={<CheckCircleOutlined />}
        />
        <MetricCard
          label={t('models.metrics.linkedBrands')}
          value={linkedBrandCount}
          hint={t('models.metrics.linkedBrandsHint')}
          icon={<TagsOutlined />}
        />
      </div>

      <SectionCard
        title={t('models.page.directoryTitle')}
        description={t('models.page.directoryDescription')}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            disabled={!hasBrands}
            size="large"
            className="rounded-full px-6 sm:self-start"
          >
            {t('models.page.add')}
          </Button>
        }
      >
        <ModelList models={models} brandNames={brandNames} loading={loading} onEdit={openEditModal} />
      </SectionCard>

      <Modal
        open={isModalOpen}
        title={editingModel ? t('models.page.editModal') : t('models.page.createModal')}
        onCancel={closeModal}
        footer={null}
        destroyOnHidden
        centered
        width={560}
      >
        <ModelForm
          initialValues={editingModel ?? undefined}
          onSubmit={(values) => {
            void handleSubmit(values)
          }}
          isLoading={saving}
        />
      </Modal>
    </div>
  )
}
