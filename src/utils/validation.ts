import type { Rule } from 'antd/es/form'

import { normalizeCarPlateNumber } from '../services/carService'
import { normalizeCustomerPhoneNumber } from '../services/customerService'
import { MAX_MONEY_AMOUNT } from './currency'

const VN_PHONE_PATTERN = /^0(3|5|7|8|9)\d{8}$/
const VN_PLATE_PATTERN = /^\d{2}[A-Z]{1,2}\d{4,5}$/
const GOVERNMENT_ID_PATTERN = /^(?:\d{9}|\d{12})$/
const DRIVER_LICENSE_PATTERN = /^[A-Za-z0-9]{8,20}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ACTIVE_RENTAL_STATUSES = new Set(['confirmed', 'in-progress', 'completed'])

export const formScrollToFirstError = {
  behavior: 'smooth' as const,
  block: 'center' as const,
}

export const formValidateTrigger = ['onBlur', 'onSubmit'] as const

export function isBlank(value: unknown) {
  if (value == null) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim().length === 0
  }

  return false
}

export function normalizeEmail(value?: string | null) {
  return value?.trim() ?? ''
}

export function hasDuplicateCustomerPhone(
  value: string | undefined,
  records: Array<{ id?: string; phoneNumber?: string }>,
  currentId?: string
) {
  const normalized = normalizeCustomerPhoneNumber(value)

  if (!normalized) {
    return false
  }

  return records.some((record) => {
    if (!record.id || record.id === currentId) {
      return false
    }

    return normalizeCustomerPhoneNumber(record.phoneNumber) === normalized
  })
}

export function requiredTrimmed(message: string): Rule {
  return {
    validator: async (_, value) => {
      if (isBlank(value)) {
        return Promise.reject(new Error(message))
      }

      return Promise.resolve()
    },
  }
}

export function minTrimmedLength(min: number, message: string): Rule {
  return {
    validator: async (_, value) => {
      const trimmed = typeof value === 'string' ? value.trim() : ''

      if (trimmed.length < min) {
        return Promise.reject(new Error(message))
      }

      return Promise.resolve()
    },
  }
}

export function vnPhoneRule(options: { requiredMessage?: string; formatMessage: string }): Rule {
  return {
    validator: async (_, value) => {
      const normalized = normalizeCustomerPhoneNumber(typeof value === 'string' ? value : undefined)

      if (!normalized) {
        if (options.requiredMessage) {
          return Promise.reject(new Error(options.requiredMessage))
        }

        return Promise.resolve()
      }

      if (!VN_PHONE_PATTERN.test(normalized)) {
        return Promise.reject(new Error(options.formatMessage))
      }

      return Promise.resolve()
    },
  }
}

export function duplicatePhoneRule(
  message: string,
  getRecords: () => Array<{ id?: string; phoneNumber?: string }>,
  options?: { getCurrentId?: () => string | undefined; skip?: () => boolean }
): Rule {
  return {
    validator: async (_, value) => {
      if (options?.skip?.()) {
        return Promise.resolve()
      }

      if (hasDuplicateCustomerPhone(typeof value === 'string' ? value : undefined, getRecords(), options?.getCurrentId?.())) {
        return Promise.reject(new Error(message))
      }

      return Promise.resolve()
    },
  }
}

export function emailRule(message: string): Rule {
  return {
    validator: async (_, value) => {
      const trimmed = normalizeEmail(typeof value === 'string' ? value : undefined)

      if (!trimmed) {
        return Promise.resolve()
      }

      if (!EMAIL_PATTERN.test(trimmed)) {
        return Promise.reject(new Error(message))
      }

      return Promise.resolve()
    },
  }
}

export function vnPlateRule(requiredMessage: string, formatMessage: string): Rule {
  return {
    validator: async (_, value) => {
      const normalized = normalizeCarPlateNumber(typeof value === 'string' ? value : undefined)

      if (!normalized) {
        return Promise.reject(new Error(requiredMessage))
      }

      if (!VN_PLATE_PATTERN.test(normalized)) {
        return Promise.reject(new Error(formatMessage))
      }

      return Promise.resolve()
    },
  }
}

export function governmentIdRule(message: string): Rule {
  return {
    validator: async (_, value) => {
      const compact = typeof value === 'string' ? value.replace(/\s+/g, '') : ''

      if (!compact) {
        return Promise.resolve()
      }

      if (!GOVERNMENT_ID_PATTERN.test(compact)) {
        return Promise.reject(new Error(message))
      }

      return Promise.resolve()
    },
  }
}

export function driverLicenseRule(message: string): Rule {
  return {
    validator: async (_, value) => {
      const compact = typeof value === 'string' ? value.trim() : ''

      if (!compact) {
        return Promise.resolve()
      }

      if (!DRIVER_LICENSE_PATTERN.test(compact)) {
        return Promise.reject(new Error(message))
      }

      return Promise.resolve()
    },
  }
}

function rejectIfMoneyTooLarge(amount: number, maxMessage: string) {
  if (amount > MAX_MONEY_AMOUNT) {
    return Promise.reject(new Error(maxMessage))
  }

  return Promise.resolve()
}

export function nonNegativeMoneyRule(message: string, maxMessage: string): Rule {
  return {
    validator: async (_, value) => {
      if (value == null || value === '') {
        return Promise.resolve()
      }

      const amount = Number(value)

      if (!Number.isFinite(amount) || amount < 0) {
        return Promise.reject(new Error(message))
      }

      return rejectIfMoneyTooLarge(amount, maxMessage)
    },
  }
}

export function positiveMoneyRule(message: string, maxMessage: string): Rule {
  return {
    validator: async (_, value) => {
      const amount = Number(value)

      if (!Number.isFinite(amount) || amount <= 0) {
        return Promise.reject(new Error(message))
      }

      return rejectIfMoneyTooLarge(amount, maxMessage)
    },
  }
}

export function rentalAmountRule(options: {
  nonNegativeMessage: string
  positiveWhenActiveMessage: string
  maxMessage: string
}): Rule {
  return ({ getFieldValue }) => ({
    validator: async (_, value) => {
      const amount = Number(value ?? 0)

      if (!Number.isFinite(amount) || amount < 0) {
        return Promise.reject(new Error(options.nonNegativeMessage))
      }

      if (amount > MAX_MONEY_AMOUNT) {
        return Promise.reject(new Error(options.maxMessage))
      }

      const status = getFieldValue('status') as string | undefined

      if (status && ACTIVE_RENTAL_STATUSES.has(status) && amount <= 0) {
        return Promise.reject(new Error(options.positiveWhenActiveMessage))
      }

      return Promise.resolve()
    },
  })
}
