import { useState } from 'react'
import { LeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Grid } from 'antd'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { BookingForm, BookingFormValues } from '../../components/bookings/BookingForm'
import { db } from '../../services/firebase'
import {
  getBookingFinanceGuardMessage,
  isCarAvailable,
  prepareBookingPayload,
  syncBookingTransaction,
  syncCarStatusWithBookings,
} from '../../services/bookingService'

export function NewBookingPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()
  const { message } = App.useApp()
  const screen = Grid.useBreakpoint()
  const isMobile = screen.md === false;

  const handleSubmit = async (values: BookingFormValues) => {
    setLoading(true)

    try {
      const financeGuardMessage = getBookingFinanceGuardMessage(values.status, values)

      if (financeGuardMessage) {
        message.error(t(financeGuardMessage))
        return
      }

      const startDate = values.startDate.toDate()
      const endDate = values.endDate.toDate()
      const available = await isCarAvailable(values.carId, startDate, endDate)

      if (!available) {
        message.error(t('bookings.messages.conflict'))
        return
      }

      const bookingPayload = await prepareBookingPayload({
        ...values,
        startDate,
        endDate,
      })

      const bookingRef = await addDoc(collection(db, 'bookings'), {
        ...bookingPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      await syncBookingTransaction(bookingRef.id, {
        customerId: bookingPayload.customerId,
        totalPrice: bookingPayload.totalPrice,
        paidAmount: bookingPayload.paidAmount,
        remainingAmount: bookingPayload.remainingAmount,
        refundAmount: bookingPayload.refundAmount,
        paymentStatus: bookingPayload.paymentStatus,
        paymentMethod: bookingPayload.paymentMethod,
        paymentNote: values.paymentNote,
      })

      await syncCarStatusWithBookings(bookingPayload.carId, {
        fallbackStatus: values.status === 'completed' || values.status === 'canceled' ? values.carReturnStatus : undefined,
      })

      message.success(t('bookings.create.success'))
      navigate('/bookings')
    } catch (error) {
      console.error('Error creating booking:', error)
      message.error(t('bookings.create.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto">
      <div className="sm:mb-6 flex items-center space-x-4">
        <Button icon={<LeftOutlined />} type="text" onClick={() => navigate('/bookings')}>
          {!isMobile && t('bookings.create.back')}
        </Button>
      </div>

      <Card className="rounded-[28px] border-0 p-4 shadow-sm">
        <BookingForm onSubmit={handleSubmit} isLoading={loading} />
      </Card>
    </div>
  )
}
