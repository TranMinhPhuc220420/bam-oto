import { useEffect, useMemo, useState } from 'react'
import {
  CarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { App, Button, Grid } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore'

import { CarList } from '../components/cars/CarList'
import { MetricCard } from '../components/ui/MetricCard'
import { SectionCard } from '../components/ui/SectionCard'
import { useBookings } from '../hooks/useBookings'
import { db } from '../services/firebase'
import { Car } from '../types/Car'

export function CarsPage() {
  const screens = Grid.useBreakpoint()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { message } = App.useApp()
  const { bookings: activeBookings, loading: activeBookingsLoading } = useBookings({ statuses: ['in-progress'] })

  useEffect(() => {
    const carsQuery = query(collection(db, 'cars'))
    const unsubscribe = onSnapshot(
      carsQuery,
      (snapshot) => {
        const carData = snapshot.docs.map((carDoc) => ({
          id: carDoc.id,
          ...carDoc.data(),
        })) as Car[]

        setCars(carData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching cars:', error)
        message.error(t('cars.messages.loadError'))
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [message, t])

  const availableCount = useMemo(
    () => cars.filter((car) => car.status === 'available').length,
    [cars]
  )

  const inServiceCount = useMemo(
    () => cars.filter((car) => car.status === 'repair' || car.status === 'cleaning').length,
    [cars]
  )

  const activeBookingByCarId = useMemo(
    () =>
      activeBookings.reduce<Record<string, { id: string; bookingCode: string }>>((accumulator, booking) => {
        if (booking.carId && booking.id && !accumulator[booking.carId]) {
          accumulator[booking.carId] = {
            id: booking.id,
            bookingCode: booking.bookingCode,
          }
        }

        return accumulator
      }, {}),
    [activeBookings]
  )

  const handleEdit = (car: Car) => {
    navigate(`/cars/edit/${car.id}`)
  }

  const handleDelete = async (carId: string) => {
    try {
      await deleteDoc(doc(db, 'cars', carId))
      message.success(t('cars.messages.deleteSuccess'))
    } catch (error) {
      console.error('Error deleting car:', error)
      message.error(t('cars.messages.deleteError'))
    }
  }

  return (
    <div className="space-y-5">
      {/* <section className="flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.35)] sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="mb-0 text-[11px] font-semibold uppercase tracking-[0.26em] text-teal-700">
            {t('cars.page.eyebrow')}
          </p>
          <h2 className="mb-0 text-2xl font-semibold text-slate-900">{t('cars.page.title')}</h2>
          <p className="mb-0 max-w-3xl text-sm text-slate-600 sm:text-base">
            {t('cars.page.description')}
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/cars/new')}
          size="large"
          className="rounded-full px-6 sm:self-start"
        >
          {t('cars.create.title')}
        </Button>
      </section> */}

      {(screens.md || screens.lg) && (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label={t('cars.metrics.total')}
            value={cars.length}
            hint={t('cars.metrics.totalHint')}
            icon={<CarOutlined />}
          />
          <MetricCard
            label={t('cars.metrics.available')}
            value={availableCount}
            hint={t('cars.metrics.availableHint')}
            icon={<CheckCircleOutlined />}
          />
          <MetricCard
            label={t('cars.metrics.service')}
            value={inServiceCount}
            hint={t('cars.metrics.serviceHint')}
            icon={<ToolOutlined />}
          />
        </div>
      )}

      <SectionCard
        title={t('cars.page.inventoryTitle')}
        description={t('cars.page.inventoryDescription')}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/cars/new')}
            size="small"
            className="rounded-full px-6 sm:self-start"
          >
            {t('cars.create.title')}
          </Button>
        }
      >
        <CarList
          cars={cars}
          isLoading={loading || activeBookingsLoading}
          activeBookingByCarId={activeBookingByCarId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </SectionCard>
    </div>
  )
}
