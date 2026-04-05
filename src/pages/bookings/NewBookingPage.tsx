import { useState } from 'react'
import { LeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Typography } from 'antd'
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
} from '../../services/bookingService'

const { Title } = Typography

export function NewBookingPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()
  const { message } = App.useApp()

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
      <div className="mb-6 flex items-center space-x-4">
        <Button icon={<LeftOutlined />} type="text" onClick={() => navigate('/bookings')}>
          {t('bookings.create.back')}
        </Button>
        <Title level={2} className="!mb-0 !mt-0 text-slate-900">
          {t('bookings.create.title')}
        </Title>
      </div>

      <Card className="rounded-[28px] border-0 p-4 shadow-sm">
        <BookingForm onSubmit={handleSubmit} isLoading={loading} />
      </Card>
    </div>
  )
}
