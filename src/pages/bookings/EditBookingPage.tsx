import { useEffect, useState } from 'react'
import { LeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Grid, Spin, Typography } from 'antd'
import { deleteField, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { BookingForm, BookingFormValues } from '../../components/bookings/BookingForm'
import {
  getBookingFinanceGuardMessage,
  isBookingTransitionAllowed,
  isCarAvailable,
  prepareBookingPayload,
  syncBookingTransaction,
  syncCarStatusWithBookings,
} from '../../services/bookingService'
import { db } from '../../services/firebase'
import { Booking } from '../../types/Booking'

const { Title } = Typography

export function EditBookingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const { t } = useTranslation()
  const { message } = App.useApp()
  const screen = Grid.useBreakpoint()
  const isMobile = screen.md === false;

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) {
        return
      }

      try {
        const bookingSnapshot = await getDoc(doc(db, 'bookings', id))

        if (!bookingSnapshot.exists()) {
          message.error(t('bookings.edit.notFound'))
          navigate('/bookings')
          return
        }

        setBooking({ id: bookingSnapshot.id, ...bookingSnapshot.data() } as Booking)
      } catch (error) {
        console.error('Error fetching booking:', error)
        message.error(t('bookings.edit.loadError'))
      } finally {
        setFetching(false)
      }
    }

    void fetchBooking()
  }, [id, message, navigate, t])

  const handleDocumentUrlsChange = async (documentUrls: string[]) => {
    if (!id || booking?.status === 'completed' || booking?.status === 'canceled') {
      return
    }

    await updateDoc(doc(db, 'bookings', id), {
      documentUrls: documentUrls.length ? documentUrls : deleteField(),
      documentUrl: documentUrls[0] ?? deleteField(),
      updatedAt: serverTimestamp(),
    })

    setBooking((current) =>
      current
        ? {
          ...current,
          documentUrls,
          documentUrl: documentUrls[0],
        }
        : current
    )
  }

  const handleSubmit = async (values: BookingFormValues) => {
    if (!id || !booking) {
      return
    }

    setLoading(true)

    try {
      if (booking.status === 'completed' || booking.status === 'canceled') {
        message.error(t('bookings.messages.closedReadOnly'))
        return
      }

      if (!isBookingTransitionAllowed(booking.status, values.status)) {
        message.error(t('bookings.messages.invalidTransition'))
        return
      }

      const financeGuardMessage = getBookingFinanceGuardMessage(values.status, values)

      if (financeGuardMessage) {
        message.error(t(financeGuardMessage))
        return
      }

      const startDate = values.startDate.toDate()
      const endDate = values.endDate.toDate()
      const available = await isCarAvailable(values.carId, startDate, endDate, id)

      if (!available) {
        message.error(t('bookings.messages.conflict'))
        return
      }

      const bookingPayload = await prepareBookingPayload(
        {
          ...values,
          startDate,
          endDate,
        },
        booking.bookingCode,
        { forUpdate: true }
      )

      await updateDoc(doc(db, 'bookings', id), {
        ...bookingPayload,
        updatedAt: serverTimestamp(),
      })

      await syncBookingTransaction(
        id,
        {
          customerId: bookingPayload.customerId,
          totalPrice: bookingPayload.totalPrice,
          paidAmount: bookingPayload.paidAmount,
          remainingAmount: bookingPayload.remainingAmount,
          refundAmount: bookingPayload.refundAmount,
          paymentStatus: bookingPayload.paymentStatus,
          paymentMethod: bookingPayload.paymentMethod,
          paymentNote: values.paymentNote,
        },
        booking
      )

      const affectedCarIds = Array.from(new Set([booking.carId, bookingPayload.carId].filter(Boolean)))
      await Promise.all(
        affectedCarIds.map((carId) =>
          syncCarStatusWithBookings(carId, {
            fallbackStatus:
              carId === bookingPayload.carId && (values.status === 'completed' || values.status === 'canceled')
                ? values.carReturnStatus
                : undefined,
          })
        )
      )

      message.success(t('bookings.edit.success'))
      navigate('/bookings')
    } catch (error) {
      console.error('Error updating booking:', error)
      message.error(t('bookings.edit.error'))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="mx-auto">
      <div className="sm:mb-6 flex items-center space-x-4">
        <Button icon={<LeftOutlined />} type="text" onClick={() => navigate('/bookings')}>
          {!isMobile && t('bookings.edit.back')}
        </Button>
        <Title level={isMobile ? 4 : 2} className="!mb-0 !mt-0 text-slate-900">
          {t('bookings.edit.title')}
        </Title>
      </div>

      <Card className="rounded-[28px] border-0 p-4 shadow-sm">
        {booking ? (
          <BookingForm
            initialValues={booking}
            onSubmit={handleSubmit}
            onDocumentUrlsChange={handleDocumentUrlsChange}
            isLoading={loading}
          />
        ) : null}
      </Card>
    </div>
  )
}
