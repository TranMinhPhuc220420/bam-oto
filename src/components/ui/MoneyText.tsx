import { formatCurrencyVnd } from '../../utils/currency'

interface MoneyTextProps {
  value: number | null | undefined
  language?: string
  className?: string
}

export function MoneyText({ value, language, className }: MoneyTextProps) {
  return (
    <span className={['money-amount', className].filter(Boolean).join(' ')}>
      {formatCurrencyVnd(value, language)}
    </span>
  )
}
