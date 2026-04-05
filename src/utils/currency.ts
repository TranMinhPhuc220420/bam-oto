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
  const numericValue = Number((value ?? '').replace(/[^\d-]/g, ''))

  return Number.isFinite(numericValue) ? numericValue : 0
}
