import { useEffect, useMemo, useState } from 'react'
import { CarOutlined, EditOutlined, LeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Empty, Grid, Spin, Tag, Typography } from 'antd'
import { doc, getDoc } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { BookingDetailContent } from '../../components/bookings/BookingDetailDrawer'
import { db } from '../../services/firebase'
import { Booking } from '../../types/Booking'
import { Car, CarStatus } from '../../types/Car'

const { Title, Paragraph, Text } = Typography

const carStatusColors: Record<CarStatus, string> = {
  available: 'green',
  rented: 'blue',
  cleaning: 'orange',
  repair: 'red',
}

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [fetching, setFetching] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [car, setCar] = useState<Car | null>(null);
  const screen = Grid.useBreakpoint();
  const isMobile = screen.md === false;

  useEffect(() => {
    const fetchBookingDetail = async () => {
      if (!id) {
        navigate('/bookings')
        return
      }

      try {
        const bookingSnapshot = await getDoc(doc(db, 'bookings', id))

        if (!bookingSnapshot.exists()) {
          message.error(t('bookings.detailPage.notFound'))
          navigate('/bookings')
          return
        }

        const nextBooking = { id: bookingSnapshot.id, ...bookingSnapshot.data() } as Booking
        setBooking(nextBooking)

        if (nextBooking.carId) {
          const carSnapshot = await getDoc(doc(db, 'cars', nextBooking.carId))

          if (carSnapshot.exists()) {
            setCar({ id: carSnapshot.id, ...carSnapshot.data() } as Car)
          } else {
            setCar(null)
          }
        }
      } catch (error) {
        console.error('Error fetching booking detail:', error)
        message.error(t('bookings.detailPage.loadError'))
      } finally {
        setFetching(false)
      }
    }

    void fetchBookingDetail()
  }, [id, message, navigate, t])

  const carImages = useMemo(() => car?.images?.filter(Boolean) ?? [], [car?.images])

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!booking) {
    return null
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className={isMobile ? 'space-y-3' : 'flex flex-col gap-3 md:flex-row md:items-center md:justify-between'}>
        <div className="flex items-start gap-3">
          <Button
            icon={<LeftOutlined />}
            type="text"
            onClick={() => navigate('/bookings')}
            className={isMobile ? 'mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm' : ''}
          />
          <div className="min-w-0">
            <Title level={isMobile ? 4 : 2} className="!mb-0 !mt-0 text-slate-900">
              {t('bookings.detailPage.title', { bookingCode: booking.bookingCode })}
            </Title>
            <Paragraph className="!mb-0 text-slate-500">
              {t('bookings.detailPage.description')}
            </Paragraph>
          </div>
        </div>

        <div className={isMobile ? 'mx-8' : 'mx-4'}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/bookings/edit/${booking.id}`)}
            block={isMobile}
            className="rounded-full px-5"
          >
            {t('common.actions.edit')}
          </Button>
        </div>
      </div>

      <div className={isMobile ? 'px-2' : ''}>
        <Card className={isMobile ? 'rounded-[22px] border-0 shadow-sm px-2' : 'rounded-[28px] border-0 shadow-sm'}>
          <div className="mb-4 flex items-center gap-2 text-slate-900">
            <CarOutlined />
            <Title level={4} className="!mb-0">
              {t('bookings.detailPage.vehicleTitle')}
            </Title>
          </div>

          <Paragraph className="!mb-5 text-slate-600">
            {t('bookings.detailPage.vehicleDescription')}
          </Paragraph>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr] xl:gap-6">
            <div>
              {carImages.length ? (
                <div className={isMobile ? 'flex gap-3 overflow-x-auto pb-1' : 'grid gap-3 sm:grid-cols-2'}>
                  {carImages.slice(0, 4).map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className={[
                        'overflow-hidden rounded-2xl border border-slate-200 bg-slate-50',
                        isMobile ? 'min-w-[82%] shrink-0 snap-center' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <img
                        src={imageUrl}
                        alt={`${booking.carSnapshot?.plateNumber ?? booking.bookingCode}-${index + 1}`}
                        className={isMobile ? 'h-48 w-full object-cover' : 'h-52 w-full object-cover'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('bookings.detailPage.noCarImages')} />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <Descriptions
                column={1}
                size="small"
                items={[
                  {
                    key: 'plateNumber',
                    label: t('bookings.detailPage.plateNumber'),
                    children: car?.plateNumber ?? booking.carSnapshot?.plateNumber ?? t('bookings.details.noValue'),
                  },
                  {
                    key: 'brandModel',
                    label: t('bookings.detailPage.brandModel'),
                    children:
                      [car?.brand, car?.model].filter(Boolean).join(' • ') ||
                      [booking.carSnapshot?.brand, booking.carSnapshot?.model].filter(Boolean).join(' • ') ||
                      t('bookings.details.noValue'),
                  },
                  {
                    key: 'year',
                    label: t('bookings.detailPage.year'),
                    children: car?.year ?? t('bookings.details.noValue'),
                  },
                  {
                    key: 'fuelType',
                    label: t('bookings.detailPage.fuelType'),
                    children: car?.fuelType
                      ? t(car.fuelType === 'Gas' ? 'cars.list.fuel.gas' : 'cars.list.fuel.electric')
                      : t('bookings.details.noValue'),
                  },
                  {
                    key: 'color',
                    label: t('bookings.detailPage.color'),
                    children: car?.color ?? t('bookings.details.noValue'),
                  },
                  {
                    key: 'status',
                    label: t('bookings.detailPage.currentStatus'),
                    children: car?.status ? (
                      <Tag color={carStatusColors[car.status]} className="rounded-full px-3 py-1 font-medium">
                        {t(`cars.list.statusLabels.${car.status}`)}
                      </Tag>
                    ) : booking.carSnapshot?.status ? (
                      <Tag color={carStatusColors[booking.carSnapshot.status]} className="rounded-full px-3 py-1 font-medium">
                        {t(`cars.list.statusLabels.${booking.carSnapshot.status}`)}
                      </Tag>
                    ) : (
                      <Text>{t('bookings.details.noValue')}</Text>
                    ),
                  },
                  {
                    key: 'note',
                    label: t('bookings.details.note'),
                    children: car?.note?.trim() || t('bookings.detailPage.noCarNote'),
                  },
                ]}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-5"></div>

      <div className={isMobile ? 'px-2' : ''}>
        <Card className="rounded-[28px] border-0 shadow-sm">
          <BookingDetailContent booking={booking} />
        </Card>
      </div>

    </div>
  )
}
