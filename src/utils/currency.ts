export const MAX_MONEY_AMOUNT = 99_999_999_999

const MAX_MONEY_DIGITS = String(MAX_MONEY_AMOUNT).length

export function getCurrencyLocale(language?: string) {
  return language?.startsWith('vi') ? 'vi-VN' : 'en-GB'
}

export function formatCurrencyVnd(value: number | null | undefined, language?: string) {
  const amount = Number.isFinite(value) ? Number(value) : 0

  return new Intl.NumberFormat(getCurrencyLocale(language), {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatVndInput(value: string | number | null | undefined) {
  if (value === undefined || value === null || value === '') {
    return ''
  }

  const numericValue = typeof value === 'number' ? value : Number(String(value).replace(/[^\d-]/g, ''))

  if (!Number.isFinite(numericValue)) {
    return ''
  }

  return `${numericValue.toLocaleString('vi-VN')} ₫`
}

export function parseVndInput(value: string | undefined) {
  const digits = (value ?? '').replace(/[^\d]/g, '')

  if (!digits) {
    return 0
  }

  if (digits.length > MAX_MONEY_DIGITS) {
    return MAX_MONEY_AMOUNT
  }

  const numericValue = Number(digits)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.min(numericValue, MAX_MONEY_AMOUNT)
}
