import { Select } from 'antd'
import type { SelectProps } from 'antd'
import { useTranslation } from 'react-i18next'

import { useCarBrands } from '../../hooks/useCarBrands'
import { CarBrand } from '../../types/Brand'

interface BrandSelectorProps extends Omit<SelectProps<string>, 'options' | 'loading'> {
  includeInactive?: boolean
  onBrandRecordChange?: (brand: CarBrand | null) => void
}

export function BrandSelector({
  includeInactive = false,
  onBrandRecordChange,
  onChange,
  placeholder,
  ...props
}: BrandSelectorProps) {
  const { brands, loading } = useCarBrands({ includeInactive })
  const { t } = useTranslation()
  const selectableBrands = brands.filter((brand): brand is CarBrand & { id: string } => Boolean(brand.id))

  const handleChange: SelectProps<string>['onChange'] = (value, option) => {
    onChange?.(value, option)
    onBrandRecordChange?.(selectableBrands.find((brand) => brand.id === value) ?? null)
  }

  return (
    <Select
      {...props}
      showSearch
      optionFilterProp="label"
      loading={loading}
      placeholder={placeholder ?? t('cars.selector.selectBrand')}
      options={selectableBrands.map((brand) => ({
        value: brand.id,
        label:
          brand.isActive === false
            ? `${brand.name} (${t('cars.selector.inactiveSuffix')})`
            : brand.name,
      }))}
      onChange={handleChange}
    />
  )
}
