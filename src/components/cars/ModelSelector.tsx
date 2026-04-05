import { Select } from 'antd'
import type { SelectProps } from 'antd'
import { useTranslation } from 'react-i18next'

import { useCarModels } from '../../hooks/useCarModels'
import { CarModel } from '../../types/Model'

interface ModelSelectorProps extends Omit<SelectProps<string>, 'options' | 'loading'> {
  brandId?: string
  includeInactive?: boolean
  onModelRecordChange?: (model: CarModel | null) => void
}

export function ModelSelector({
  brandId,
  includeInactive = false,
  onModelRecordChange,
  onChange,
  placeholder,
  disabled,
  ...props
}: ModelSelectorProps) {
  const { models, loading } = useCarModels(brandId, { includeInactive })
  const { t } = useTranslation()
  const selectableModels = models.filter((model): model is CarModel & { id: string } => Boolean(model.id))

  const handleChange: SelectProps<string>['onChange'] = (value, option) => {
    onChange?.(value, option)
    onModelRecordChange?.(selectableModels.find((model) => model.id === value) ?? null)
  }

  return (
    <Select
      {...props}
      showSearch
      optionFilterProp="label"
      loading={loading}
      disabled={disabled ?? !brandId}
      placeholder={
        placeholder ?? (brandId ? t('cars.selector.selectModel') : t('cars.selector.selectBrandFirst'))
      }
      options={selectableModels.map((model) => ({
        value: model.id,
        label:
          model.isActive === false
            ? `${model.name} (${t('cars.selector.inactiveSuffix')})`
            : model.name,
      }))}
      onChange={handleChange}
    />
  )
}
