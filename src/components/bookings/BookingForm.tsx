import { useEffect, useMemo } from 'react'
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
import { Button, DatePicker, Empty, Form, Input, InputNumber, Select, Steps, Tag, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import { useCars } from '../../hooks/useCars'
import { useCustomers } from '../../hooks/useCustomers'
import { getBookingAdjustmentItems, getBookingExtraChargeItems } from '../../services/bookingService'
import { formatCurrencyVnd, formatVndInput, parseVndInput } from '../../utils/currency'
import {
  Booking,
  BookingAdjustmentItem,
  BookingAdjustmentType,
  BookingExtraChargeItem,
  BookingExtraChargeType,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../types/Booking'
import { SectionCard } from '../ui/SectionCard'
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
  onSubmit: (values: BookingFormValues) => void
  onDocumentUrlsChange?: (urls: string[]) => Promise<void> | void
  isLoading?: boolean
}

const bookingStatuses: BookingStatus[] = ['draft', 'confirmed', 'in-progress', 'completed', 'canceled']
const bookingProgressStages = ['draft', 'confirmed', 'in-progress', 'completed'] as const
const paymentMethods: PaymentMethod[] = ['cash', 'bank-transfer', 'card', 'other']
const chargeTypes: BookingExtraChargeType[] = ['fuel', 'late-fee', 'damage', 'cleaning', 'toll', 'other']
const adjustmentTypes: BookingAdjustmentType[] = ['discount', 'refund', 'waiver', 'other']
const paymentStatusColors: Record<PaymentStatus, string> = {
  unpaid: 'gold',
  partial: 'cyan',
  paid: 'green',
  refunded: 'volcano',
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

export function BookingForm({
  initialValues,
  onSubmit,
  onDocumentUrlsChange,
  isLoading = false,
}: BookingFormProps) {
  const [form] = Form.useForm<BookingFormValues>()
  const { t, i18n } = useTranslation()
  const { cars, loading: carsLoading } = useCars()
  const { customers, loading: customersLoading } = useCustomers()
  const selectedCustomerId = Form.useWatch('customerId', form)
  const selectedCarId = Form.useWatch('carId', form)
  const currentBookingStatus =
    (Form.useWatch('status', form) as BookingStatus | undefined) ?? initialValues?.status ?? 'draft'
  const currentPaymentStatus = (Form.useWatch('paymentStatus', form) as PaymentStatus | undefined) ?? 'unpaid'
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

  const selectedCar = useMemo(() => cars.find((car) => car.id === selectedCarId), [cars, selectedCarId])
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
  const currentBooking = initialValues?.id ? (initialValues as Booking) : null
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
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
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

      <SectionCard
        className="mb-6"
        title={t('bookings.form.progressTitle')}
        description={t('bookings.form.progressDescription')}
      >
        <div className="space-y-4 p-4 sm:p-5">
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
            responsive
            items={bookingProgressItems}
            className="[&_.ant-steps-item-description]:!max-w-[220px] [&_.ant-steps-item-description]:!text-xs [&_.ant-steps-item-description]:!leading-5 [&_.ant-steps-item-icon]:!h-8 [&_.ant-steps-item-icon]:!w-8 [&_.ant-steps-item-title]:!text-sm [&_.ant-steps-item-title]:!font-semibold"
          />
        </div>
      </SectionCard>

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
            placeholder={t('bookings.form.carPlaceholder')}
            options={cars.map((car) => ({
              value: car.id,
              label: `${car.plateNumber} • ${[car.brand, car.model].filter(Boolean).join(' ')}`,
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
            placeholder={t('bookings.form.customerPlaceholder')}
            options={customers.map((customer) => ({
              value: customer.id,
              label: `${customer.fullName} • ${customer.phoneNumber}`,
            }))}
          />
        </Form.Item>
      </div>

      {selectedCar ? (
        <Typography.Paragraph className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t('bookings.form.selectedCarHelper', {
            plateNumber: selectedCar.plateNumber,
            brand: selectedCar.brand,
            model: selectedCar.model,
          })}
        </Typography.Paragraph>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Form.Item
          name="customerName"
          label={t('bookings.form.customerName')}
          rules={[{ required: true, message: t('bookings.form.validation.customerName') }]}
        >
          <Input placeholder={t('bookings.form.customerNamePlaceholder')} />
        </Form.Item>

        <Form.Item
          name="customerPhoneNumber"
          label={t('bookings.form.customerPhoneNumber')}
          rules={[{ required: true, message: t('bookings.form.validation.customerPhoneNumber') }]}
        >
          <Input placeholder={t('bookings.form.customerPhoneNumberPlaceholder')} />
        </Form.Item>

        <Form.Item
          name="customerEmail"
          label={t('bookings.form.customerEmail')}
          rules={[{ type: 'email', message: t('bookings.form.validation.customerEmail') }]}
        >
          <Input placeholder={t('bookings.form.customerEmailPlaceholder')} />
        </Form.Item>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Form.Item
          name="startDate"
          label={t('bookings.form.startDate')}
          rules={[{ required: true, message: t('bookings.form.validation.startDate') }]}
        >
          <DatePicker showTime className="w-full" format="DD/MM/YYYY HH:mm" />
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
          <DatePicker showTime className="w-full" format="DD/MM/YYYY HH:mm" />
        </Form.Item>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Form.Item
          name="pickupLocation"
          label={t('bookings.form.pickupLocation')}
          rules={[{ required: true, message: t('bookings.form.validation.pickupLocation') }]}
        >
          <Input placeholder={t('bookings.form.pickupLocationPlaceholder')} />
        </Form.Item>

        <Form.Item
          name="returnLocation"
          label={t('bookings.form.returnLocation')}
          rules={[{ required: true, message: t('bookings.form.validation.returnLocation') }]}
        >
          <Input placeholder={t('bookings.form.returnLocationPlaceholder')} />
        </Form.Item>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Form.Item name="status" label={t('bookings.form.status')} rules={[{ required: true }]}>
          <Select options={bookingStatuses.map((status) => ({ value: status, label: t(`bookings.status.${status}`) }))} />
        </Form.Item>

        <Form.Item label={t('bookings.form.paymentStatus')}>
          <div className="flex min-h-8 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Tag color={paymentStatusColors[currentPaymentStatus]} className="!mr-0 rounded-full px-3 py-1 font-medium">
              {t(`bookings.paymentStatus.${currentPaymentStatus}`)}
            </Tag>
            <Typography.Text className="text-sm text-slate-500">
              {t('bookings.form.paymentStatusHelper')}
            </Typography.Text>
          </div>
        </Form.Item>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
        <div>
          <Typography.Title level={5} className="!mb-1 !text-slate-900">
            {t('bookings.form.fixedChargesTitle')}
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 text-sm text-slate-500">
            {t('bookings.form.fixedChargesDescription')}
          </Typography.Paragraph>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Form.Item
            name="rentalAmount"
            label={t('bookings.form.rentalAmount')}
            rules={[{ required: true, message: t('bookings.form.validation.rentalAmount') }]}
            className="!mb-0"
          >
            <InputNumber
              min={0}
              precision={0}
              step={100000}
              controls={false}
              className="w-full"
              formatter={formatVndInput}
              parser={parseVndInput}
            />
          </Form.Item>

          <Form.Item name="depositAmount" label={t('bookings.form.depositAmount')} className="!mb-0">
            <InputNumber
              min={0}
              precision={0}
              step={100000}
              controls={false}
              className="w-full"
              formatter={formatVndInput}
              parser={parseVndInput}
            />
          </Form.Item>

          <Form.Item name="securityDeposit" label={t('bookings.form.securityDeposit')} className="!mb-0">
            <InputNumber
              min={0}
              precision={0}
              step={100000}
              controls={false}
              className="w-full"
              formatter={formatVndInput}
              parser={parseVndInput}
            />
          </Form.Item>
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography.Title level={5} className="!mb-1 !text-slate-900">
              {t('bookings.form.surchargesTitle')}
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 text-sm text-slate-500">
              {t('bookings.form.surchargesDescription')}
            </Typography.Paragraph>
          </div>
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
                  className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 lg:grid-cols-[160px_minmax(0,1.2fr)_140px_minmax(0,1fr)_auto]"
                >
                  <Form.Item name={[field.name, 'id']} hidden>
                    <Input />
                  </Form.Item>

                  <Form.Item name={[field.name, 'type']} label={t('bookings.form.chargeType')} className="!mb-0">
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

                  <Form.Item name={[field.name, 'amount']} label={t('bookings.form.lineItemAmount')} className="!mb-0">
                    <InputNumber
                      min={0}
                      precision={0}
                      step={100000}
                      controls={false}
                      className="w-full"
                      formatter={formatVndInput}
                      parser={parseVndInput}
                    />
                  </Form.Item>

                  <Form.Item name={[field.name, 'note']} label={t('bookings.form.lineItemNote')} className="!mb-0">
                    <Input placeholder={t('bookings.form.lineItemNotePlaceholder')} />
                  </Form.Item>

                  <div className="flex items-end">
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                      {t('common.actions.delete')}
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(createChargeRow())}>
                {t('bookings.form.addSurcharge')}
              </Button>
            </div>
          )}
        </Form.List>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography.Title level={5} className="!mb-1 !text-slate-900">
              {t('bookings.form.adjustmentsTitle')}
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 text-sm text-slate-500">
              {t('bookings.form.adjustmentsDescription')}
            </Typography.Paragraph>
          </div>
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
                  className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 lg:grid-cols-[160px_minmax(0,1.2fr)_140px_minmax(0,1fr)_auto]"
                >
                  <Form.Item name={[field.name, 'id']} hidden>
                    <Input />
                  </Form.Item>

                  <Form.Item name={[field.name, 'type']} label={t('bookings.form.adjustmentType')} className="!mb-0">
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

                  <Form.Item name={[field.name, 'amount']} label={t('bookings.form.lineItemAmount')} className="!mb-0">
                    <InputNumber
                      min={0}
                      precision={0}
                      step={100000}
                      controls={false}
                      className="w-full"
                      formatter={formatVndInput}
                      parser={parseVndInput}
                    />
                  </Form.Item>

                  <Form.Item name={[field.name, 'note']} label={t('bookings.form.lineItemNote')} className="!mb-0">
                    <Input placeholder={t('bookings.form.lineItemNotePlaceholder')} />
                  </Form.Item>

                  <div className="flex items-end">
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                      {t('common.actions.delete')}
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(createAdjustmentRow())}>
                {t('bookings.form.addAdjustment')}
              </Button>
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
        <div className="space-y-4 bg-emerald-50/60 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
              <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t('bookings.form.paidAmount')}
              </Typography.Text>
              <div className="mt-1 text-lg font-semibold text-emerald-700">
                {formatCurrencyVnd(cumulativePaidAmount, i18n.resolvedLanguage)}
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
                {formatCurrencyVnd(remainingAmount, i18n.resolvedLanguage)}
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
                {formatCurrencyVnd(depositGap, i18n.resolvedLanguage)}
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
              className="!mb-0"
            >
              <InputNumber
                min={0}
                precision={0}
                step={100000}
                controls={false}
                className="w-full"
                placeholder={t('bookings.form.paymentAmountThisTimePlaceholder')}
                formatter={formatVndInput}
                parser={parseVndInput}
              />
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
              <Typography.Paragraph className="!mb-0 mt-2 text-sm text-slate-600">
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
        <div className="p-4 sm:p-5">
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
        <div className="p-4 sm:p-5">
          <Form.Item name="documentUrls" className="!mb-0">
            <BookingDocumentUpload onPersistChange={onDocumentUrlsChange} />
          </Form.Item>
        </div>
      </SectionCard>

      <SectionCard className="mt-6" title={t('bookings.form.note')}>
        <div className="space-y-4 p-4 sm:p-5">
          <Form.Item name="note" className="!mb-0">
            <Input.TextArea rows={4} placeholder={t('bookings.form.notePlaceholder')} />
          </Form.Item>

          <Form.Item className="!mb-0">
            <div className="flex justify-end">
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {initialValues ? t('bookings.form.submitUpdate') : t('bookings.form.submitCreate')}
              </Button>
            </div>
          </Form.Item>
        </div>
      </SectionCard>
    </Form>
  )
}
