import { useEffect, useMemo, useState } from 'react'
import { CheckCircleOutlined, PlusOutlined, TagsOutlined } from '@ant-design/icons'
import { App, Button, Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { BrandForm, type BrandFormValues } from '../../components/brands/BrandForm'
import { BrandList } from '../../components/brands/BrandList'
import { MetricCard } from '../../components/ui/MetricCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { db } from '../../services/firebase'
import { CarBrand } from '../../types/Brand'

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function CarBrandsPage() {
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<CarBrand | null>(null)
  const { t } = useTranslation()
  const { message } = App.useApp()

  useEffect(() => {
    const brandsQuery = query(collection(db, 'carBrands'), orderBy('name'))
    const unsubscribe = onSnapshot(
      brandsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((brandDoc) => ({
          id: brandDoc.id,
          ...brandDoc.data(),
        })) as CarBrand[]

        setBrands(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching car brands:', error)
        message.error(t('brands.messages.loadError'))
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [message, t])

  const activeCount = useMemo(() => brands.filter((brand) => brand.isActive !== false).length, [brands])
  const inactiveCount = brands.length - activeCount

  const openCreateModal = () => {
    setEditingBrand(null)
    setIsModalOpen(true)
  }

  const openEditModal = (brand: CarBrand) => {
    setEditingBrand(brand)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setEditingBrand(null)
    setIsModalOpen(false)
  }

  const handleSubmit = async (values: BrandFormValues) => {
    setSaving(true)

    try {
      const normalizedName = normalizeName(values.name)
      const duplicateSnapshot = await getDocs(
        query(collection(db, 'carBrands'), where('normalizedName', '==', normalizedName))
      )
      const hasDuplicate = duplicateSnapshot.docs.some((brandDoc) => brandDoc.id !== editingBrand?.id)

      if (hasDuplicate) {
        message.error(t('brands.messages.duplicate'))
        return
      }

      const payload = {
        name: values.name,
        normalizedName,
        isActive: values.isActive,
        updatedAt: serverTimestamp(),
      }

      if (editingBrand?.id) {
        await updateDoc(doc(db, 'carBrands', editingBrand.id), payload)
        message.success(t('brands.messages.updated'))
      } else {
        await addDoc(collection(db, 'carBrands'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
        message.success(t('brands.messages.created'))
      }

      closeModal()
    } catch (error) {
      console.error('Error saving car brand:', error)
      message.error(t('brands.messages.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* <section className="flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.35)] sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="mb-0 text-[11px] font-semibold uppercase tracking-[0.26em] text-teal-700">
            {t('brands.page.eyebrow')}
          </p>
          <h2 className="mb-0 text-2xl font-semibold text-slate-900">{t('brands.page.title')}</h2>
          <p className="mb-0 max-w-3xl text-sm text-slate-600 sm:text-base">
            {t('brands.page.description')}
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="rounded-full px-6 sm:self-start"
          onClick={openCreateModal}
        >
          {t('brands.page.add')}
        </Button>
      </section> */}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label={t('brands.metrics.total')}
          value={brands.length}
          hint={t('brands.metrics.totalHint')}
          icon={<TagsOutlined />}
        />
        <MetricCard
          label={t('brands.metrics.active')}
          value={activeCount}
          hint={t('brands.metrics.activeHint')}
          icon={<CheckCircleOutlined />}
        />
        <MetricCard
          label={t('brands.metrics.inactive')}
          value={inactiveCount}
          hint={t('brands.metrics.inactiveHint')}
          icon={<TagsOutlined />}
        />
      </div>

      <SectionCard
        title={t('brands.page.directoryTitle')}
        description={t('brands.page.directoryDescription')}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="rounded-full px-6 sm:self-start"
            onClick={openCreateModal}
          >
            {t('brands.page.add')}
          </Button>
        }
      >
        <BrandList brands={brands} loading={loading} onEdit={openEditModal} />
      </SectionCard>

      <Modal
        open={isModalOpen}
        title={editingBrand ? t('brands.page.editModal') : t('brands.page.createModal')}
        onCancel={closeModal}
        footer={null}
        destroyOnHidden
        centered
        width={560}
      >
        <BrandForm
          initialValues={editingBrand ?? undefined}
          onSubmit={(values) => {
            void handleSubmit(values)
          }}
          isLoading={saving}
        />
      </Modal>
    </div>
  )
}
