import { Select } from 'antd'
import type { SelectProps } from 'antd'
import { useTranslation } from 'react-i18next'

import { UserRole } from '../../types/User'

export function RoleSelector(props: SelectProps<UserRole>) {
  const { t } = useTranslation()

  return (
    <Select {...props}>
      <Select.Option value="admin">{t('common.roles.admin')}</Select.Option>
      <Select.Option value="staff">{t('common.roles.staff')}</Select.Option>
    </Select>
  )
}
