import { useEffect, useMemo, type ReactNode } from 'react'
import {
  CalendarOutlined,
  CarOutlined,
  DeleteOutlined,
  FlagOutlined,
  FormOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { App, Button, DatePicker, Empty, Form, Grid, Input, InputNumber, Select, Spin, Steps, Tag, TimePicker, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import { useBookings } from '../../hooks/useBookings'
import { useCars } from '../../hooks/useCars'
import { useCustomers } from '../../hooks/useCustomers'
import {
  getBookingAdjustmentItems,
  getBookingExtraChargeItems,
  getBookingFinanceGuardMessage,
} from '../../services/bookingService'
import { formatCurrencyVnd, MAX_MONEY_AMOUNT } from '../../utils/currency'
import {
  duplicatePhoneRule,
  emailRule,
  formScrollToFirstError,
  formValidateTrigger,
  nonNegativeMoneyRule,
  positiveMoneyRule,
  rentalAmountRule,
  requiredTrimmed,
  vnPhoneRule,
} from '../../utils/validation'
import {
  Booking,
  BookingAdjustmentItem,
  BookingAdjustmentType,
  BookingExtraChargeItem,
  BookingExtraChargeType,
  BookingReturnCarStatus,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../types/Booking'
import { SectionCard } from '../ui/SectionCard'
import { MoneyText } from '../ui/MoneyText'
import { VndInputNumber } from '../ui/VndInputNumber'
import { BookingDocumentUpload } from './BookingDocumentUpload'
import { BookingTransactionList } from './BookingTransactionList'

export interface BookingFormValues {
  bookingCode?: string
  carId: string
  customerId?: string
  customerName: string
  customerPhoneNumber: string
  customerEmail?: string
  startDate: Dayjs
  endDate: Dayjs
  pickupLocation: string
  returnLocation: string
  status: BookingStatus
  carReturnStatus?: BookingReturnCarStatus
  totalPrice?: number
  rentalAmount?: number
  depositAmount?: number
  securityDeposit?: number
  extraChargeItems?: BookingExtraChargeItem[]
  adjustmentItems?: BookingAdjustmentItem[]
  extraCharges?: number
  discountAmount?: number
  paidAmount?: number
  paymentAmountThisTime?: number
  remainingAmount?: number
  refundAmount?: number
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  paymentNote?: string
  documentUrls?: string[]
  documentUrl?: string
  note?: string
}

interface BookingFormProps {
  initialValues?: Partial<Booking>
  onSubmit: (values: BookingFormValues) => Promise<void> | void
  onDocumentUrlsChange?: (urls: string[]) => Promise<void> | void
  isLoading?: boolean
}

const bookingStatuses: BookingStatus[] = ['draft', 'confirmed', 'in-progress', 'completed', 'canceled']
const blockingBookingStatuses: BookingStatus[] = ['draft', 'confirmed', 'in-progress']
const bookingProgressStages = ['draft', 'confirmed', 'in-progress', 'completed'] as const
const carReturnStatuses: BookingReturnCarStatus[] = ['available', 'cleaning', 'repair']
const paymentMethods: PaymentMethod[] = ['cash', 'bank-transfer', 'card', 'other']
const chargeTypes: BookingExtraChargeType[] = ['fuel', 'late-fee', 'damage', 'cleaning', 'toll', 'other']
const adjustmentTypes: BookingAdjustmentType[] = ['discount', 'refund', 'waiver', 'other']
const bookingStatusColors: Record<BookingStatus, string> = {
  draft: 'default',
  confirmed: 'green',
  'in-progress': 'blue',
  completed: 'purple',
  canceled: 'red',
}
const paymentStatusColors: Record<PaymentStatus, string> = {
  unpaid: 'gold',
  partial: 'cyan',
  paid: 'green',
  refunded: 'volcano',
}

type BookedRange = {
  start: Dayjs
  end: Dayjs
}

function toDayjs(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return dayjs((value as { toDate: () => Date }).toDate())
  }

  if (value instanceof Date) {
    return dayjs(value)
  }

  return undefined
}

function buildRowId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function createChargeRow(): BookingExtraChargeItem {
  return {
    id: buildRowId('charge'),
    label: '',
    amount: 0,
    type: 'other',
    note: undefined,
    createdAt: new Date(),
  }
}

function createAdjustmentRow(): BookingAdjustmentItem {
  return {
    id: buildRowId('adjustment'),
    label: '',
    amount: 0,
    type: 'discount',
    note: undefined,
    createdAt: new Date(),
  }
}

function sumRowAmounts(items?: Array<{ amount?: number }>) {
  return (items ?? []).reduce((total, item) => total + (Number.isFinite(item?.amount) ? Number(item.amount) : 0), 0)
}

function isDateFullyBlocked(date: Dayjs, ranges: BookedRange[]) {
  const dayStart = date.startOf('day')
  const nextDayStart = dayStart.add(1, 'day')

  return ranges.some((range) => dayStart.valueOf() >= range.start.valueOf() && nextDayStart.valueOf() <= range.end.valueOf())
}

function addMinuteWindow(minutesByHour: Map<number, Set<number>>, start: Dayjs, end: Dayjs) {
  if (!end.isAfter(start)) {
    return
  }

  const normalizedStart = start.startOf('minute')
  const normalizedLastMinute = end.subtract(1, 'minute').startOf('minute')

  if (normalizedLastMinute.valueOf() < normalizedStart.valueOf()) {
    const minuteSet = minutesByHour.get(normalizedStart.hour()) ?? new Set<number>()
    minuteSet.add(normalizedStart.minute())
    minutesByHour.set(normalizedStart.hour(), minuteSet)
    return
  }

  for (let hour = normalizedStart.hour(); hour <= normalizedLastMinute.hour(); hour += 1) {
    const minuteSet = minutesByHour.get(hour) ?? new Set<number>()
    const minMinute = hour === normalizedStart.hour() ? normalizedStart.minute() : 0
    const maxMinute = hour === normalizedLastMinute.hour() ? normalizedLastMinute.minute() : 59

    for (let minute = minMinute; minute <= maxMinute; minute += 1) {
      minuteSet.add(minute)
    }

    minutesByHour.set(hour, minuteSet)
  }
}

function buildDisabledTimeConfig(
  current: Dayjs | null,
  options: {
    blockedRanges?: BookedRange[]
    minDateTime?: Dayjs | null
    maxDateTime?: Dayjs | null
  } = {}
) {
  if (!current) {
    return {}
  }

  const minutesByHour = new Map<number, Set<number>>()
  const dayStart = current.startOf('day')
  const nextDayStart = dayStart.add(1, 'day')

  const applyWindow = (start: Dayjs, end: Dayjs) => {
    const clampedStart = start.isAfter(dayStart) ? start : dayStart
    const clampedEnd = end.isBefore(nextDayStart) ? end : nextDayStart

    addMinuteWindow(minutesByHour, clampedStart, clampedEnd)
  }

  for (const range of options.blockedRanges ?? []) {
    if (range.end.isAfter(dayStart) && range.start.isBefore(nextDayStart)) {
      applyWindow(range.start, range.end)
    }
  }

  if (options.minDateTime && current.isSame(options.minDateTime, 'day')) {
    applyWindow(dayStart, options.minDateTime)
  }

  if (options.maxDateTime && current.isSame(options.maxDateTime, 'day')) {
    applyWindow(options.maxDateTime, nextDayStart)
  }

  const disabledHours = Array.from({ length: 24 }, (_, hour) => hour).filter(
    (hour) => (minutesByHour.get(hour)?.size ?? 0) >= 60
  )

  return {
    disabledHours: () => disabledHours,
    disabledMinutes: (hour: number) => Array.from(minutesByHour.get(hour) ?? []).sort((a, b) => a - b),
  }
}

export function BookingForm({
  initialValues,
  onSubmit,
  onDocumentUrlsChange,
  isLoading = false,
}: BookingFormProps) {
  const [form] = Form.useForm<BookingFormValues>()
  const { t, i18n } = useTranslation()
  const moneyMaxMessage = t('common.validation.moneyMax', {
    max: formatCurrencyVnd(MAX_MONEY_AMOUNT, i18n.resolvedLanguage),
  })
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const { modal } = App.useApp()
  const { bookings: activeBookings } = useBookings({ statuses: blockingBookingStatuses })
  const { cars, loading: carsLoading } = useCars()
  const { customers: customerDirectory, loading: customersLoading } = useCustomers({ includeInactive: true })
  const customers = useMemo(
    () =>
      customerDirectory.filter(
        (customer) => customer.isActive !== false || customer.id === initialValues?.customerId
      ),
    [customerDirectory, initialValues?.customerId]
  )
  const selectedCustomerId = Form.useWatch('customerId', form)
  const selectedCarId = Form.useWatch('carId', form)
  const selectedStartDate = Form.useWatch('startDate', form) as Dayjs | undefined
  const selectedEndDate = Form.useWatch('endDate', form) as Dayjs | undefined
  const currentBooking = initialValues?.id ? (initialValues as Booking) : null
  const isExistingBooking = Boolean(currentBooking?.id)
  const currentBookingStatus =
    (Form.useWatch('status', form) as BookingStatus | undefined) ?? initialValues?.status ?? 'draft'
  const currentPaymentStatus =
    (Form.useWatch('paymentStatus', form) as PaymentStatus | undefined) ?? initialValues?.paymentStatus ?? 'unpaid'
  const isReadOnlyBooking = currentBooking?.status === 'completed' || currentBooking?.status === 'canceled'
  const isIdentityLocked = isExistingBooking
  const requiresCarReturnStatus = currentBookingStatus === 'completed' || currentBookingStatus === 'canceled'
  const rentalAmount = Number(Form.useWatch('rentalAmount', form) ?? 0)
  const depositAmount = Number(Form.useWatch('depositAmount', form) ?? 0)
  const paymentAmountThisTime = Number(Form.useWatch('paymentAmountThisTime', form) ?? 0)
  const basePaidAmount = Number(initialValues?.paidAmount ?? 0)
  const watchedExtraChargeItems = Form.useWatch('extraChargeItems', form) as BookingExtraChargeItem[] | undefined
  const watchedAdjustmentItems = Form.useWatch('adjustmentItems', form) as BookingAdjustmentItem[] | undefined
  const extraChargeItems = useMemo(() => watchedExtraChargeItems ?? [], [watchedExtraChargeItems])
  const adjustmentItems = useMemo(() => watchedAdjustmentItems ?? [], [watchedAdjustmentItems])

  useEffect(() => {
    if (!initialValues) {
      return
    }

    form.setFieldsValue({
      bookingCode: initialValues.bookingCode,
      carId: initialValues.carId,
      customerId: initialValues.customerId,
      customerName: initialValues.customerSnapshot?.fullName,
      customerPhoneNumber: initialValues.customerSnapshot?.phoneNumber,
      customerEmail: initialValues.customerSnapshot?.email,
      startDate: toDayjs(initialValues.startDate),
      endDate: toDayjs(initialValues.endDate),
      pickupLocation: initialValues.pickupLocation,
      returnLocation: initialValues.returnLocation,
      status: initialValues.status,
      carReturnStatus: initialValues.carReturnStatus,
      totalPrice: initialValues.totalPrice,
      rentalAmount: initialValues.rentalAmount ?? initialValues.totalPrice,
      depositAmount: initialValues.depositAmount,
      securityDeposit: initialValues.securityDeposit,
      extraChargeItems: getBookingExtraChargeItems({
        extraChargeItems: initialValues.extraChargeItems,
        extraCharges: initialValues.extraCharges,
      }),
      adjustmentItems: getBookingAdjustmentItems({
        adjustmentItems: initialValues.adjustmentItems,
        discountAmount: initialValues.discountAmount,
        refundAmount: initialValues.refundAmount,
      }),
      extraCharges: initialValues.extraCharges,
      discountAmount: initialValues.discountAmount,
      paidAmount: initialValues.paidAmount,
      paymentAmountThisTime: 0,
      remainingAmount: initialValues.remainingAmount,
      refundAmount: initialValues.refundAmount,
      paymentStatus: initialValues.paymentStatus,
      paymentMethod: initialValues.paymentMethod ?? 'other',
      paymentNote: undefined,
      documentUrls: initialValues.documentUrls ?? (initialValues.documentUrl ? [initialValues.documentUrl] : []),
      note: initialValues.note,
    })
  }, [form, initialValues])

  useEffect(() => {
    if (!selectedCustomerId) {
      return
    }

    const customer = customers.find((entry) => entry.id === selectedCustomerId)

    if (!customer) {
      return
    }

    form.setFieldsValue({
      customerName: customer.fullName,
      customerPhoneNumber: customer.phoneNumber,
      customerEmail: customer.email,
    })
  }, [customers, form, selectedCustomerId])

  useEffect(() => {
    const currentValue = form.getFieldValue('carReturnStatus') as BookingReturnCarStatus | undefined

    if (currentBookingStatus === 'completed') {
      if (!currentValue) {
        form.setFieldValue('carReturnStatus', 'cleaning')
      }

      return
    }

    if (currentBookingStatus === 'canceled') {
      if (!currentValue) {
        form.setFieldValue('carReturnStatus', 'available')
      }

      return
    }

    if (currentValue !== undefined) {
      form.setFieldValue('carReturnStatus', undefined)
    }
  }, [currentBookingStatus, form])

  const selectedCar = useMemo(() => cars.find((car) => car.id === selectedCarId), [cars, selectedCarId])
  const mobileScheduleSummary = useMemo(() => {
    if (!selectedStartDate && !selectedEndDate) {
      return '—'
    }

    const startLabel = selectedStartDate ? selectedStartDate.format('DD/MM HH:mm') : '—'
    const endLabel = selectedEndDate ? selectedEndDate.format('DD/MM HH:mm') : '—'

    return `${startLabel} → ${endLabel}`
  }, [selectedEndDate, selectedStartDate])
  const renderMobileSectionIntro = (title: string, description?: string, aside?: ReactNode) => {
    if (!isMobile) {
      return null
    }

    return (
      <div className="border-b border-slate-200/70 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Typography.Title level={5} className="!mb-1 !text-base !text-slate-900">
              {title}
            </Typography.Title>
            {description ? (
              <Typography.Paragraph className="!mb-0 text-xs leading-5 text-slate-500">
                {description}
              </Typography.Paragraph>
            ) : null}
          </div>
          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>
      </div>
    )
  }
  const blockedRanges = useMemo(() => {
    if (!selectedCarId) {
      return []
    }

    return activeBookings
      .filter((booking) => booking.carId === selectedCarId && booking.id !== currentBooking?.id)
      .map((booking) => {
        const start = toDayjs(booking.startDate)
        const end = toDayjs(booking.endDate)

        if (!start || !end || !end.isAfter(start)) {
          return null
        }

        return { start, end }
      })
      .filter((range): range is BookedRange => Boolean(range))
      .sort((left, right) => left.start.valueOf() - right.start.valueOf())
  }, [activeBookings, currentBooking?.id, selectedCarId])
  const nextBlockedStartAfterSelectedStart = useMemo(() => {
    if (!selectedStartDate) {
      return null
    }

    return (
      blockedRanges.find(
        (range) => range.start.valueOf() >= selectedStartDate.valueOf() && range.end.valueOf() > selectedStartDate.valueOf()
      )?.start ?? null
    )
  }, [blockedRanges, selectedStartDate])
  const latestBlockedEndBeforeSelectedEnd = useMemo(() => {
    if (!selectedEndDate) {
      return null
    }

    return blockedRanges.reduce<Dayjs | null>((latest, range) => {
      if (range.start.valueOf() >= selectedEndDate.valueOf() || range.end.valueOf() > selectedEndDate.valueOf()) {
        return latest
      }

      if (!latest || range.end.valueOf() > latest.valueOf()) {
        return range.end
      }

      return latest
    }, null)
  }, [blockedRanges, selectedEndDate])
  const disableStartDate = (current: Dayjs) => {
    if (!current) {
      return false
    }

    if (current.endOf('day').isBefore(dayjs())) {
      return true
    }

    if (selectedEndDate && current.startOf('day').isAfter(selectedEndDate.startOf('day'))) {
      return true
    }

    return isDateFullyBlocked(current, blockedRanges)
  }
  const disableEndDate = (current: Dayjs) => {
    if (!current) {
      return false
    }

    if (current.endOf('day').isBefore(dayjs())) {
      return true
    }

    if (selectedStartDate && current.endOf('day').isBefore(selectedStartDate)) {
      return true
    }

    if (nextBlockedStartAfterSelectedStart && current.startOf('day').isAfter(nextBlockedStartAfterSelectedStart.startOf('day'))) {
      return true
    }

    return isDateFullyBlocked(current, blockedRanges)
  }
  const disableStartTime = (current: Dayjs | null) => {
    const nowBoundary = dayjs().add(1, 'minute')
    const minDateTime =
      latestBlockedEndBeforeSelectedEnd && latestBlockedEndBeforeSelectedEnd.isAfter(nowBoundary)
        ? latestBlockedEndBeforeSelectedEnd
        : nowBoundary

    return buildDisabledTimeConfig(current, {
      blockedRanges,
      minDateTime,
      maxDateTime: selectedEndDate ?? null,
    })
  }
  const disableEndTime = (current: Dayjs | null) => {
    const minDateTime = selectedStartDate ? selectedStartDate.add(1, 'minute') : dayjs().add(1, 'minute')

    if (selectedStartDate) {
      return buildDisabledTimeConfig(current, {
        minDateTime,
        maxDateTime: nextBlockedStartAfterSelectedStart ? nextBlockedStartAfterSelectedStart.add(1, 'minute') : null,
      })
    }

    return buildDisabledTimeConfig(current, {
      blockedRanges,
      minDateTime,
    })
  }
  const extraCharges = useMemo(() => sumRowAmounts(extraChargeItems), [extraChargeItems])
  const discountAmount = useMemo(
    () => sumRowAmounts(adjustmentItems.filter((item) => item?.type !== 'refund')),
    [adjustmentItems]
  )
  const refundAmount = useMemo(
    () => sumRowAmounts(adjustmentItems.filter((item) => item?.type === 'refund')),
    [adjustmentItems]
  )
  const fixedTotal = rentalAmount + depositAmount
  const adjustmentTotal = discountAmount + refundAmount
  const calculatedTotal = Math.max(fixedTotal + extraCharges - adjustmentTotal, 0)
  const cumulativePaidAmount = Math.max(basePaidAmount + paymentAmountThisTime, 0)
  const remainingAmount = Math.max(calculatedTotal - cumulativePaidAmount, 0)
  const depositGap = Math.max(depositAmount - cumulativePaidAmount, 0)
  const hasTransactionHistory = Boolean(currentBooking?.id)
  const currentProgressStatus =
    (currentBookingStatus === 'canceled' ? 'draft' : currentBookingStatus) as (typeof bookingProgressStages)[number]
  const currentProgressStep = currentBookingStatus === 'canceled' ? -1 : bookingProgressStages.indexOf(currentProgressStatus)
  const bookingProgressItems = [
    {
      title: t('bookings.form.progress.draft.title'),
      description: t('bookings.form.progress.draft.description'),
      icon: <FormOutlined />,
    },
    {
      title: t('bookings.form.progress.confirmed.title'),
      description: t('bookings.form.progress.confirmed.description'),
      icon: <CalendarOutlined />,
    },
    {
      title: t('bookings.form.progress.in-progress.title'),
      description: t('bookings.form.progress.in-progress.description'),
      icon: <CarOutlined />,
    },
    {
      title: t('bookings.form.progress.completed.title'),
      description: t('bookings.form.progress.completed.description'),
      icon: <FlagOutlined />,
    },
  ]

  const updateDateTimeField = (fieldName: 'startDate' | 'endDate', part: 'date' | 'time', value: Dayjs | null) => {
    if (!value) {
      form.setFieldValue(fieldName, undefined)
      return
    }

    const currentValue = form.getFieldValue(fieldName) as Dayjs | undefined
    const fallbackBase =
      fieldName === 'endDate' && selectedStartDate ? selectedStartDate.add(1, 'minute') : dayjs().add(1, 'minute')
    const baseValue = currentValue ?? fallbackBase
    const nextValue =
      part === 'date'
        ? value.hour(baseValue.hour()).minute(baseValue.minute()).second(0).millisecond(0)
        : baseValue.hour(value.hour()).minute(value.minute()).second(0).millisecond(0)

    form.setFieldValue(fieldName, nextValue)
    void form.validateFields([fieldName]).catch(() => undefined)
  }

  const handleCarChange = (value: string) => {
    const car = cars.find((entry) => entry.id === value)

    if (!car) {
      return
    }

    form.setFields([{ name: 'carId', errors: [] }])

    if (isReadOnlyBooking || car.status !== 'cleaning') {
      return
    }

    const previousCarId = selectedCarId && selectedCarId !== value ? selectedCarId : undefined

    modal.confirm({
      title: t('bookings.form.cleaningWarningTitle'),
      content: t('bookings.form.cleaningWarningDescription', { plateNumber: car.plateNumber }),
      okText: t('bookings.form.cleaningWarningConfirm'),
      cancelText: t('bookings.form.cleaningWarningCancel'),
      onCancel: () => {
        form.setFieldValue('carId', previousCarId)
      },
    })
  }

  const handleFinish = (values: BookingFormValues) => {
    const car = cars.find((entry) => entry.id === values.carId)

    if (car?.status === 'repair') {
      form.setFields([{ name: 'carId', errors: [t('bookings.form.validation.carRepairBlocked')] }])
      form.scrollToField('carId', formScrollToFirstError)
      return
    }

    const financeGuardMessage = getBookingFinanceGuardMessage(values.status, values)

    if (financeGuardMessage) {
      const fieldName =
        financeGuardMessage === 'bookings.messages.depositRequired' ? 'depositAmount' : 'paymentAmountThisTime'

      form.setFields([{ name: fieldName, errors: [t(financeGuardMessage)] }])
      form.scrollToField(fieldName, formScrollToFirstError)
      return
    }

    return onSubmit(values)
  }

  useEffect(() => {
    const nextFields = {
      totalPrice: calculatedTotal,
      paidAmount: cumulativePaidAmount,
      remainingAmount,
      extraCharges,
      discountAmount,
      refundAmount,
    }

    const currentFields = form.getFieldsValue([
      'totalPrice',
      'paidAmount',
      'remainingAmount',
      'extraCharges',
      'discountAmount',
      'refundAmount',
    ]) as Partial<BookingFormValues>

    if (
      currentFields.totalPrice !== nextFields.totalPrice ||
      currentFields.paidAmount !== nextFields.paidAmount ||
      currentFields.remainingAmount !== nextFields.remainingAmount ||
      currentFields.extraCharges !== nextFields.extraCharges ||
      currentFields.discountAmount !== nextFields.discountAmount ||
      currentFields.refundAmount !== nextFields.refundAmount
    ) {
      form.setFieldsValue(nextFields)
    }
  }, [calculatedTotal, cumulativePaidAmount, discountAmount, extraCharges, form, refundAmount, remainingAmount])

  useEffect(() => {
    const nextPaymentStatus: PaymentStatus =
      refundAmount > 0
        ? 'refunded'
        : calculatedTotal > 0 && remainingAmount === 0
          ? 'paid'
          : cumulativePaidAmount > 0
            ? 'partial'
            : 'unpaid'

    if (form.getFieldValue('paymentStatus') !== nextPaymentStatus) {
      form.setFieldValue('paymentStatus', nextPaymentStatus)
    }
  }, [calculatedTotal, cumulativePaidAmount, form, refundAmount, remainingAmount])

  return (
    <Spin spinning={isLoading} size="large" tip={t('bookings.form.submitting')}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        disabled={isLoading || isReadOnlyBooking}
        className={isMobile ? 'mobile-safe-bottom' : undefined}
        validateTrigger={[...formValidateTrigger]}
        scrollToFirstError={formScrollToFirstError}
        initialValues={{
          status: 'draft',
          paymentStatus: 'unpaid',
          paymentMethod: 'cash',
          totalPrice: 0,
          rentalAmount: 0,
          depositAmount: 0,
          securityDeposit: 0,
          extraChargeItems: [],
          adjustmentItems: [],
          extraCharges: 0,
          discountAmount: 0,
          paidAmount: 0,
          paymentAmountThisTime: 0,
          refundAmount: 0,
          pickupLocation: t('bookings.form.defaultLocation'),
          returnLocation: t('bookings.form.defaultLocation'),
        }}
      >
      <Form.Item name="paidAmount" hidden>
        <InputNumber />
      </Form.Item>
      <Form.Item name="paymentStatus" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="totalPrice" hidden>
        <InputNumber />
      </Form.Item>
      <Form.Item name="remainingAmount" hidden>
        <InputNumber />
      </Form.Item>
      <Form.Item name="extraCharges" hidden>
        <InputNumber />
      </Form.Item>
      <Form.Item name="discountAmount" hidden>
        <InputNumber />
      </Form.Item>
      <Form.Item name="refundAmount" hidden>
        <InputNumber />
      </Form.Item>

      {isMobile ? (
        <div className="mobile-card-list mb-4 gap-2.5">
          <div className="rounded-[20px] border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Tag color={bookingStatusColors[currentBookingStatus]} className="!mr-0 rounded-full px-3 py-1 font-medium">
                {t(`bookings.status.${currentBookingStatus}`)}
              </Tag>
              <Tag color={paymentStatusColors[currentPaymentStatus]} className="!mr-0 rounded-full px-3 py-1 font-medium">
                {t(`bookings.paymentStatus.${currentPaymentStatus}`)}
              </Tag>
            </div>

            <div className="mt-3 space-y-2.5 text-sm text-slate-600">
              <div className="flex items-start gap-2.5">
                <CarOutlined className="mt-0.5 text-slate-400" />
                <div className="min-w-0">
                  <div className="mobile-clamp-1 font-medium text-slate-900">
                    {selectedCar
                      ? `${selectedCar.plateNumber} • ${[selectedCar.brand, selectedCar.model].filter(Boolean).join(' ')}`
                      : '—'}
                  </div>
                  <div className="mobile-clamp-2 text-xs text-slate-500">
                    {selectedCar ? t(`cars.list.statusLabels.${selectedCar.status}`) : t('bookings.form.carPlaceholder')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CalendarOutlined className="mt-0.5 text-slate-400" />
                <div className="text-xs leading-5 text-slate-500">{mobileScheduleSummary}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-[18px] border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
              <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('bookings.finance.total')}
              </Typography.Text>
              <div className="mt-1 text-base font-semibold text-slate-900">
                <MoneyText value={calculatedTotal} language={i18n.resolvedLanguage} />
              </div>
            </div>

            <div className="rounded-[18px] border border-amber-100 bg-amber-50/70 px-3.5 py-3 shadow-sm">
              <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                {t('bookings.finance.remaining')}
              </Typography.Text>
              <div className="mt-1 text-base font-semibold text-amber-800">
                <MoneyText value={remainingAmount} language={i18n.resolvedLanguage} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <SectionCard
        className="mb-6"
        title={t('bookings.form.progressTitle')}
        description={t('bookings.form.progressDescription')}
      >
        {renderMobileSectionIntro(
          t('bookings.form.progressTitle'),
          t('bookings.form.progressDescription'),
          <Tag color={bookingStatusColors[currentBookingStatus]} className="!mr-0 rounded-full px-3 py-1 font-medium">
            {t(`bookings.status.${currentBookingStatus}`)}
          </Tag>
        )}

        <div className={isMobile ? 'space-y-3 p-3.5' : 'space-y-4 p-4 sm:p-5'}>
          {currentBookingStatus === 'canceled' ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <Tag color="red" icon={<StopOutlined />} className="!mr-0 rounded-full px-3 py-1 font-medium">
                {t('bookings.status.canceled')}
              </Tag>
              <Typography.Text className="text-sm text-rose-700">
                {t('bookings.form.progressCanceledHelper')}
              </Typography.Text>
            </div>
          ) : null}

          <Steps
            current={currentProgressStep}
            direction={isMobile ? 'vertical' : 'horizontal'}
            responsive={!isMobile}
            size={isMobile ? 'small' : 'default'}
            items={bookingProgressItems.map((item) => ({
              ...item,
              description: isMobile ? undefined : item.description,
            }))}
            className={
              isMobile
                ? '[&_.ant-steps-item-description]:hidden [&_.ant-steps-item-icon]:!h-7 [&_.ant-steps-item-icon]:!w-7 [&_.ant-steps-item-tail]:!ps-3.5 [&_.ant-steps-item-title]:!text-sm [&_.ant-steps-item-title]:!font-semibold'
                : '[&_.ant-steps-item-description]:!max-w-[220px] [&_.ant-steps-item-description]:!text-xs [&_.ant-steps-item-description]:!leading-5 [&_.ant-steps-item-icon]:!h-8 [&_.ant-steps-item-icon]:!w-8 [&_.ant-steps-item-title]:!text-sm [&_.ant-steps-item-title]:!font-semibold'
            }
          />
        </div>
      </SectionCard>

      {isExistingBooking ? (
        <Typography.Paragraph className="!mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {isReadOnlyBooking ? t('bookings.form.readOnlyClosedHelper') : t('bookings.form.identityLockedHelper')}
        </Typography.Paragraph>
      ) : null}

      <SectionCard
        className="mb-6"
        title={t('bookings.form.identityTitle')}
        description={t('bookings.form.identityDescription')}
      >
        {renderMobileSectionIntro(t('bookings.form.identityTitle'), t('bookings.form.identityDescription'))}

        <div className={isMobile ? 'space-y-3 p-3.5' : 'space-y-4 p-4 sm:p-5'}>
      <div className="grid gap-4 md:grid-cols-2">
        <Form.Item
          name="carId"
          label={t('bookings.form.car')}
          rules={[{ required: true, message: t('bookings.form.validation.car') }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={carsLoading}
            disabled={isIdentityLocked}
            placeholder={t('bookings.form.carPlaceholder')}
            onChange={handleCarChange}
            options={cars.map((car) => ({
              value: car.id,
              label: `${car.plateNumber} • ${[car.brand, car.model].filter(Boolean).join(' ')} • ${t(`cars.list.statusLabels.${car.status}`)}`,
              disabled: car.status === 'repair',
            }))}
          />
        </Form.Item>

        <Form.Item name="customerId" label={t('bookings.form.customer')}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            loading={customersLoading}
            disabled={isIdentityLocked}
            placeholder={t('bookings.form.customerPlaceholder')}
            options={customers.map((customer) => ({
              value: customer.id,
              label: `${customer.fullName} • ${customer.phoneNumber}`,
            }))}
          />
        </Form.Item>
      </div>

      {selectedCar ? (
        <div className="space-y-3">
          <Typography.Paragraph className="!mb-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {t('bookings.form.selectedCarHelper', {
              plateNumber: selectedCar.plateNumber,
              brand: selectedCar.brand,
              model: selectedCar.model,
              status: t(`cars.list.statusLabels.${selectedCar.status}`),
            })}
          </Typography.Paragraph>

          {selectedCar.status === 'cleaning' && !isReadOnlyBooking ? (
            <Typography.Paragraph className="!mb-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {t('bookings.form.selectedCarCleaningHelper')}
            </Typography.Paragraph>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Form.Item
          name="customerName"
          label={t('bookings.form.customerName')}
          rules={[requiredTrimmed(t('bookings.form.validation.customerName'))]}
        >
          <Input disabled={isIdentityLocked} placeholder={t('bookings.form.customerNamePlaceholder')} />
        </Form.Item>

        <Form.Item
          name="customerPhoneNumber"
          label={t('bookings.form.customerPhoneNumber')}
          dependencies={['customerId']}
          validateFirst
          rules={[
            vnPhoneRule({
              requiredMessage: t('bookings.form.validation.customerPhoneNumber'),
              formatMessage: t('common.validation.phoneFormat'),
            }),
            duplicatePhoneRule(t('bookings.form.validation.duplicatePhone'), () => customerDirectory, {
              getCurrentId: () => form.getFieldValue('customerId'),
            }),
          ]}
        >
          <Input
            disabled={isIdentityLocked}
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('bookings.form.customerPhoneNumberPlaceholder')}
          />
        </Form.Item>

        <Form.Item
          name="customerEmail"
          label={t('bookings.form.customerEmail')}
          rules={[emailRule(t('common.validation.emailFormat'))]}
        >
          <Input
            disabled={isIdentityLocked}
            inputMode="email"
            autoComplete="email"
            placeholder={t('bookings.form.customerEmailPlaceholder')}
          />
        </Form.Item>
      </div>
        </div>
      </SectionCard>

      <SectionCard
        className="mb-6"
        title={t('bookings.form.scheduleSectionTitle')}
        description={t('bookings.form.scheduleSectionDescription')}
      >
        {renderMobileSectionIntro(t('bookings.form.scheduleSectionTitle'), t('bookings.form.scheduleSectionDescription'))}

        <div className={isMobile ? 'space-y-3 p-3.5' : 'space-y-4 p-4 sm:p-5'}>
      {isMobile ? (
        <div className="grid gap-4">
          <Form.Item
            name="startDate"
            hidden
            rules={[{ required: true, message: t('bookings.form.validation.startDate') }]}
          >
            <DatePicker />
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {() => {
              const errors = form.getFieldError('startDate')

              return (
                <Form.Item
                  label={t('bookings.form.startDate')}
                  required
                  validateStatus={errors.length ? 'error' : undefined}
                  help={errors[0]}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DatePicker
                      size="large"
                      className="w-full"
                      format="DD/MM/YYYY"
                      value={selectedStartDate ?? null}
                      disabled={isIdentityLocked}
                      disabledDate={disableStartDate}
                      inputReadOnly
                      onChange={(value) => updateDateTimeField('startDate', 'date', value)}
                    />

                    <TimePicker
                      size="large"
                      className="w-full"
                      format="HH:mm"
                      minuteStep={5}
                      value={selectedStartDate ?? null}
                      disabled={isIdentityLocked || !selectedStartDate}
                      disabledTime={() => disableStartTime(selectedStartDate ?? null)}
                      inputReadOnly
                      onChange={(value) => updateDateTimeField('startDate', 'time', value)}
                    />
                  </div>
                </Form.Item>
              )
            }}
          </Form.Item>

          <Form.Item
            name="endDate"
            hidden
            dependencies={['startDate']}
            rules={[
              { required: true, message: t('bookings.form.validation.endDate') },
              ({ getFieldValue }) => ({
                validator(_, value: Dayjs | undefined) {
                  const startDate = getFieldValue('startDate') as Dayjs | undefined

                  if (!value || !startDate || value.isAfter(startDate)) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error(t('bookings.form.validation.endDateAfterStart')))
                },
              }),
            ]}
          >
            <DatePicker />
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {() => {
              const errors = form.getFieldError('endDate')

              return (
                <Form.Item
                  label={t('bookings.form.endDate')}
                  required
                  validateStatus={errors.length ? 'error' : undefined}
                  help={errors[0]}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DatePicker
                      size="large"
                      className="w-full"
                      format="DD/MM/YYYY"
                      value={selectedEndDate ?? null}
                      disabledDate={disableEndDate}
                      inputReadOnly
                      onChange={(value) => updateDateTimeField('endDate', 'date', value)}
                    />

                    <TimePicker
                      size="large"
                      className="w-full"
                      format="HH:mm"
                      minuteStep={5}
                      value={selectedEndDate ?? null}
                      disabled={!selectedEndDate}
                      disabledTime={() => disableEndTime(selectedEndDate ?? null)}
                      inputReadOnly
                      onChange={(value) => updateDateTimeField('endDate', 'time', value)}
                    />
                  </div>
                </Form.Item>
              )
            }}
          </Form.Item>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Form.Item
            name="startDate"
            label={t('bookings.form.startDate')}
            rules={[{ required: true, message: t('bookings.form.validation.startDate') }]}
          >
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              className="w-full"
              format="DD/MM/YYYY HH:mm"
              disabled={isIdentityLocked}
              disabledDate={disableStartDate}
              disabledTime={disableStartTime}
            />
          </Form.Item>

          <Form.Item
            name="endDate"
            label={t('bookings.form.endDate')}
            dependencies={['startDate']}
            rules={[
              { required: true, message: t('bookings.form.validation.endDate') },
              ({ getFieldValue }) => ({
                validator(_, value: Dayjs | undefined) {
                  const startDate = getFieldValue('startDate') as Dayjs | undefined

                  if (!value || !startDate || value.isAfter(startDate)) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error(t('bookings.form.validation.endDateAfterStart')))
                },
              }),
            ]}
          >
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              className="w-full"
              format="DD/MM/YYYY HH:mm"
              disabledDate={disableEndDate}
              disabledTime={disableEndTime}
            />
          </Form.Item>
        </div>
      )}
        </div>
      </SectionCard>

      <SectionCard
        className="mb-6"
        title={t('bookings.form.locationsTitle')}
        description={t('bookings.form.locationsDescription')}
      >
        {renderMobileSectionIntro(t('bookings.form.locationsTitle'), t('bookings.form.locationsDescription'))}

        <div className={isMobile ? 'space-y-3 p-3.5' : 'space-y-4 p-4 sm:p-5'}>
      <div className="grid gap-4 md:grid-cols-2">
        <Form.Item
          name="pickupLocation"
          label={t('bookings.form.pickupLocation')}
          rules={[requiredTrimmed(t('bookings.form.validation.pickupLocation'))]}
        >
          <Input placeholder={t('bookings.form.pickupLocationPlaceholder')} />
        </Form.Item>

        <Form.Item
          name="returnLocation"
          label={t('bookings.form.returnLocation')}
          rules={[requiredTrimmed(t('bookings.form.validation.returnLocation'))]}
        >
          <Input placeholder={t('bookings.form.returnLocationPlaceholder')} />
        </Form.Item>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Form.Item
          name="status"
          label={t('bookings.form.status')}
          help={t(`bookings.statusHint.${currentBookingStatus}`)}
          rules={[{ required: true }]}
        >
          <Select
            options={bookingStatuses.map((status) => ({
              value: status,
              label: t(`bookings.status.${status}`),
              title: t(`bookings.statusHint.${status}`),
            }))}
          />
        </Form.Item>

        {requiresCarReturnStatus ? (
          <Form.Item
            name="carReturnStatus"
            label={t('bookings.form.carReturnStatus')}
            help={t('bookings.form.carReturnStatusHelp')}
            rules={[{ required: true, message: t('bookings.form.validation.carReturnStatus') }]}
          >
            <Select
              placeholder={t('bookings.form.carReturnStatusPlaceholder')}
              options={carReturnStatuses.map((status) => ({
                value: status,
                label: t(`cars.list.statusLabels.${status}`),
              }))}
            />
          </Form.Item>
        ) : null}
      </div>
        </div>
      </SectionCard>

      {/* <div className="grid gap-4 md:grid-cols-3">
        <Form.Item label={t('bookings.form.paymentStatus')}>
          <div className="flex min-h-8 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Tag color={paymentStatusColors[currentPaymentStatus]} className="!mr-0 rounded-full px-3 py-1 font-medium">
              {t(`bookings.paymentStatus.${currentPaymentStatus}`)}
            </Tag>
            <Typography.Text sName="text-sm text-slate-500">
              {t('bookings.form.paymentStatusHelper')}
            </Typography.Text>
          </div>
        </Form.Item>
      </div> */}

      <div className={isMobile ? 'space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5' : 'space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4'}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography.Title level={5} className="!mb-1 !text-slate-900">
              {t('bookings.form.fixedChargesTitle')}
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 text-sm text-slate-500">
              {t('bookings.form.fixedChargesDescription')}
            </Typography.Paragraph>
          </div>

          <Tag color="blue" className="money-tag !mr-0 rounded-full px-3 py-1 font-medium">
            <MoneyText value={fixedTotal} language={i18n.resolvedLanguage} />
          </Tag>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Form.Item
            name="rentalAmount"
            label={t('bookings.form.rentalAmount')}
            dependencies={['status']}
            rules={[
              rentalAmountRule({
                nonNegativeMessage: t('common.validation.moneyNonNegative'),
                positiveWhenActiveMessage: t('bookings.form.validation.rentalAmountPositive'),
                maxMessage: moneyMaxMessage,
              }),
            ]}
            className="!mb-0"
          >
            <VndInputNumber />
          </Form.Item>

          <Form.Item
            name="depositAmount"
            label={t('bookings.form.depositAmount')}
            rules={[nonNegativeMoneyRule(t('common.validation.moneyNonNegative'), moneyMaxMessage)]}
            className="!mb-0"
          >
            <VndInputNumber />
          </Form.Item>

          <Form.Item
            name="securityDeposit"
            label={t('bookings.form.securityDeposit')}
            rules={[nonNegativeMoneyRule(t('common.validation.moneyNonNegative'), moneyMaxMessage)]}
            className="!mb-0"
          >
            <VndInputNumber />
          </Form.Item>
        </div>
      </div>

      <div className={isMobile ? 'mt-5 space-y-3 rounded-2xl border border-slate-200/80 bg-white p-3.5' : 'mt-6 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4'}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography.Title level={5} className="!mb-1 !text-slate-900">
              {t('bookings.form.surchargesTitle')}
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 text-sm text-slate-500">
              {t('bookings.form.surchargesDescription')}
            </Typography.Paragraph>
          </div>

          <Tag color="processing" className="money-tag !mr-0 rounded-full px-3 py-1 font-medium">
            <MoneyText value={extraCharges} language={i18n.resolvedLanguage} />
          </Tag>
        </div>

        <Form.List name="extraChargeItems">
          {(fields, { add, remove }) => (
            <div className="space-y-3">
              {!fields.length ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('bookings.form.noSurcharges')} />
              ) : null}

              {fields.map((field) => (
                <div
                  key={field.key}
                  className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 md:grid-cols-[minmax(0,160px)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <Form.Item name={[field.name, 'id']} hidden>
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'type']}
                    label={t('bookings.form.chargeType')}
                    rules={[{ required: true, message: t('common.validation.lineItemType') }]}
                    className="!mb-0"
                  >
                    <Select
                      placeholder={t('bookings.form.chargeTypePlaceholder')}
                      options={chargeTypes.map((type) => ({
                        value: type,
                        label: t(`bookings.chargeTypes.${type}`),
                      }))}
                    />
                  </Form.Item>

                  <Form.Item name={[field.name, 'label']} label={t('bookings.form.lineItemLabel')} className="!mb-0">
                    <Input placeholder={t('bookings.form.lineItemLabelPlaceholder')} />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'amount']}
                    label={t('bookings.form.lineItemAmount')}
                    rules={[positiveMoneyRule(t('common.validation.lineItemAmount'), moneyMaxMessage)]}
                    className="!mb-0"
                  >
                    <VndInputNumber />
                  </Form.Item>

                  <Form.Item name={[field.name, 'note']} label={t('bookings.form.lineItemNote')} className="!mb-0">
                    <Input placeholder={t('bookings.form.lineItemNotePlaceholder')} />
                  </Form.Item>

                  <div className="flex items-end md:justify-end">
                    <Button
                      danger
                      block={isMobile}
                      disabled={isReadOnlyBooking}
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    >
                      {t('common.actions.delete')}
                    </Button>
                  </div>
                </div>
              ))}

              {!isReadOnlyBooking ? (
                <Button block={isMobile} type="dashed" icon={<PlusOutlined />} onClick={() => add(createChargeRow())}>
                  {t('bookings.form.addSurcharge')}
                </Button>
              ) : null}
            </div>
          )}
        </Form.List>
      </div>

      <div className={isMobile ? 'mt-5 space-y-3 rounded-2xl border border-slate-200/80 bg-white p-3.5' : 'mt-6 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4'}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography.Title level={5} className="!mb-1 !text-slate-900">
              {t('bookings.form.adjustmentsTitle')}
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 text-sm text-slate-500">
              {t('bookings.form.adjustmentsDescription')}
            </Typography.Paragraph>
          </div>

          <Tag color="purple" className="money-tag !mr-0 rounded-full px-3 py-1 font-medium">
            <MoneyText value={adjustmentTotal} language={i18n.resolvedLanguage} />
          </Tag>
        </div>

        <Form.List name="adjustmentItems">
          {(fields, { add, remove }) => (
            <div className="space-y-3">
              {!fields.length ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('bookings.form.noAdjustments')} />
              ) : null}

              {fields.map((field) => (
                <div
                  key={field.key}
                  className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 md:grid-cols-[minmax(0,160px)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <Form.Item name={[field.name, 'id']} hidden>
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'type']}
                    label={t('bookings.form.adjustmentType')}
                    rules={[{ required: true, message: t('common.validation.lineItemType') }]}
                    className="!mb-0"
                  >
                    <Select
                      placeholder={t('bookings.form.adjustmentTypePlaceholder')}
                      options={adjustmentTypes.map((type) => ({
                        value: type,
                        label: t(`bookings.adjustmentTypes.${type}`),
                      }))}
                    />
                  </Form.Item>

                  <Form.Item name={[field.name, 'label']} label={t('bookings.form.lineItemLabel')} className="!mb-0">
                    <Input placeholder={t('bookings.form.lineItemLabelPlaceholder')} />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'amount']}
                    label={t('bookings.form.lineItemAmount')}
                    rules={[positiveMoneyRule(t('common.validation.lineItemAmount'), moneyMaxMessage)]}
                    className="!mb-0"
                  >
                    <VndInputNumber />
                  </Form.Item>

                  <Form.Item name={[field.name, 'note']} label={t('bookings.form.lineItemNote')} className="!mb-0">
                    <Input placeholder={t('bookings.form.lineItemNotePlaceholder')} />
                  </Form.Item>

                  <div className="flex items-end md:justify-end">
                    <Button
                      danger
                      block={isMobile}
                      disabled={isReadOnlyBooking}
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    >
                      {t('common.actions.delete')}
                    </Button>
                  </div>
                </div>
              ))}

              {!isReadOnlyBooking ? (
                <Button block={isMobile} type="dashed" icon={<PlusOutlined />} onClick={() => add(createAdjustmentRow())}>
                  {t('bookings.form.addAdjustment')}
                </Button>
              ) : null}
            </div>
          )}
        </Form.List>
      </div>

      {/* <SectionCard
        className="mt-6"
        title={t('bookings.form.summaryTitle')}
        description={t('bookings.form.summaryDescription')}
      >
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label={t('bookings.finance.fixedTotal')} value={formatCurrencyVnd(fixedTotal, i18n.resolvedLanguage)} />
          <MetricCard label={t('bookings.finance.surchargeTotal')} value={formatCurrencyVnd(extraCharges, i18n.resolvedLanguage)} />
          <MetricCard label={t('bookings.finance.adjustmentTotal')} value={formatCurrencyVnd(adjustmentTotal, i18n.resolvedLanguage)} />
          <MetricCard label={t('bookings.finance.total')} value={formatCurrencyVnd(calculatedTotal, i18n.resolvedLanguage)} />
          <MetricCard label={t('bookings.finance.paid')} value={formatCurrencyVnd(cumulativePaidAmount, i18n.resolvedLanguage)} />
          <MetricCard label={t('bookings.finance.remaining')} value={formatCurrencyVnd(remainingAmount, i18n.resolvedLanguage)} />
          <MetricCard label={t('bookings.finance.depositGap')} value={formatCurrencyVnd(depositGap, i18n.resolvedLanguage)} />
          <MetricCard label={t('bookings.finance.securityDeposit')} value={formatCurrencyVnd(securityDeposit, i18n.resolvedLanguage)} />
        </div>
      </SectionCard> */}

      <SectionCard
        className="mt-6"
        title={t('bookings.form.paymentTrackingTitle')}
        description={t('bookings.form.paymentTrackingDescription')}
      >
        {renderMobileSectionIntro(
          t('bookings.form.paymentTrackingTitle'),
          t('bookings.form.paymentTrackingDescription'),
          <Tag color={paymentStatusColors[currentPaymentStatus]} className="!mr-0 rounded-full px-3 py-1 font-medium">
            {t(`bookings.paymentStatus.${currentPaymentStatus}`)}
          </Tag>
        )}

        <div className={isMobile ? 'space-y-3 bg-emerald-50/60 p-3.5' : 'space-y-4 bg-emerald-50/60 p-4 sm:p-5'}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
              <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('bookings.form.paidAmount')}
              </Typography.Text>
              <div className="mt-1 text-lg font-semibold text-emerald-700">
                <MoneyText value={cumulativePaidAmount} language={i18n.resolvedLanguage} />
              </div>
              <Typography.Text className="text-xs text-slate-500">
                {t('bookings.form.cumulativePaidAmountHelp')}
              </Typography.Text>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
              <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('bookings.finance.remaining')}
              </Typography.Text>
              <div className="mt-1 text-lg font-semibold text-amber-700">
                <MoneyText value={remainingAmount} language={i18n.resolvedLanguage} />
              </div>
              <Typography.Text className="text-xs text-slate-500">
                {t('bookings.form.remainingAmountHelp')}
              </Typography.Text>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
              <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('bookings.finance.depositGap')}
              </Typography.Text>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                <MoneyText value={depositGap} language={i18n.resolvedLanguage} />
              </div>
              <Typography.Text className="text-xs text-slate-500">
                {t('bookings.form.depositGapHelp')}
              </Typography.Text>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Form.Item
              name="paymentAmountThisTime"
              label={t('bookings.form.paymentAmountThisTime')}
              extra={t('bookings.form.paymentAmountThisTimeHelp')}
              rules={[nonNegativeMoneyRule(t('common.validation.moneyNonNegative'), moneyMaxMessage)]}
              className="!mb-0"
            >
              <VndInputNumber placeholder={t('bookings.form.paymentAmountThisTimePlaceholder')} />
            </Form.Item>

            <Form.Item name="paymentMethod" label={t('bookings.form.paymentMethod')} className="!mb-0">
              <Select
                placeholder={t('bookings.form.paymentMethodPlaceholder')}
                options={paymentMethods.map((method) => ({ value: method, label: t(`bookings.methods.${method}`) }))}
              />
            </Form.Item>

            <Form.Item name="paymentNote" label={t('bookings.form.paymentNote')} className="!mb-0">
              <Input placeholder={t('bookings.form.paymentNotePlaceholder')} />
            </Form.Item>
          </div>

          {paymentAmountThisTime > 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3">
              <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                {t('bookings.form.paymentPreviewTitle')}
              </Typography.Text>
              <Typography.Paragraph className="money-amount !mb-0 mt-2 text-sm text-slate-600">
                {t('bookings.form.paymentPreviewDescription', {
                  paid: formatCurrencyVnd(cumulativePaidAmount, i18n.resolvedLanguage),
                  remaining: formatCurrencyVnd(remainingAmount, i18n.resolvedLanguage),
                })}
              </Typography.Paragraph>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        className="mt-6"
        title={t('bookings.form.historyTitle')}
        description={
          hasTransactionHistory ? t('bookings.form.historyDescription') : t('bookings.form.historyCreateHint')
        }
      >
        {renderMobileSectionIntro(
          t('bookings.form.historyTitle'),
          hasTransactionHistory ? t('bookings.form.historyDescription') : t('bookings.form.historyCreateHint')
        )}

        <div className={isMobile ? 'p-3.5' : 'p-4 sm:p-5'}>
          {hasTransactionHistory ? (
            <BookingTransactionList booking={currentBooking} bookingId={currentBooking?.id} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              {t('bookings.form.historyCreateHint')}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard className="mt-6" title={t('bookings.form.documents')} description={t('bookings.upload.helper')}>
        {renderMobileSectionIntro(t('bookings.form.documents'), t('bookings.upload.helper'))}

        <div className={isMobile ? 'p-3.5' : 'p-4 sm:p-5'}>
          <Form.Item name="documentUrls" className="!mb-0">
            <BookingDocumentUpload readOnly={isReadOnlyBooking} onPersistChange={isReadOnlyBooking ? undefined : onDocumentUrlsChange} />
          </Form.Item>
        </div>
      </SectionCard>

      <SectionCard className="mt-6" title={t('bookings.form.note')}>
        {renderMobileSectionIntro(t('bookings.form.note'))}

        <div className={isMobile ? 'space-y-3 p-3.5' : 'space-y-4 p-4 sm:p-5'}>
          <Form.Item name="note" className="!mb-0">
            <Input.TextArea rows={isMobile ? 3 : 4} placeholder={t('bookings.form.notePlaceholder')} />
          </Form.Item>
        </div>
      </SectionCard>

      {!isReadOnlyBooking ? (
        <div className={isMobile ? 'mobile-sticky-actions' : 'mt-6'}>
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className={isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-between gap-4'}>
              <div className="min-w-0">
                <Typography.Text strong className="block min-w-0 text-sm text-slate-900">
                  {t('bookings.finance.total')}:{' '}
                  <MoneyText value={calculatedTotal} language={i18n.resolvedLanguage} />
                </Typography.Text>
                <Typography.Text className="block min-w-0 text-xs text-slate-500">
                  {t('bookings.finance.remaining')}:{' '}
                  <MoneyText value={remainingAmount} language={i18n.resolvedLanguage} />
                </Typography.Text>
              </div>

              <Button block={isMobile} size="large" type="primary" htmlType="submit" loading={isLoading}>
                {initialValues ? t('bookings.form.submitUpdate') : t('bookings.form.submitCreate')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Form>
    </Spin>
  )
}
