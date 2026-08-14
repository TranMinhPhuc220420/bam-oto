import { InputNumber, type InputNumberProps } from 'antd'

import { formatVndInput, MAX_MONEY_AMOUNT, parseVndInput } from '../../utils/currency'

type VndInputNumberProps = Omit<InputNumberProps<number>, 'formatter' | 'parser' | 'precision'>

export function VndInputNumber({
  min = 0,
  max = MAX_MONEY_AMOUNT,
  className,
  step = 100000,
  controls = false,
  ...props
}: VndInputNumberProps) {
  return (
    <InputNumber
      min={min}
      max={max}
      precision={0}
      step={step}
      controls={controls}
      className={['w-full min-w-0', className].filter(Boolean).join(' ')}
      {...props}
      formatter={formatVndInput}
      parser={parseVndInput}
    />
  )
}
