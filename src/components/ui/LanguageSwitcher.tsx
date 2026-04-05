import { GlobalOutlined } from '@ant-design/icons'
import { Select } from 'antd'
import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const value = i18n.resolvedLanguage?.startsWith('vi') ? 'vi' : 'en'

  return (
    <Select
      aria-label={t('common.languages.label')}
      className="min-w-[132px]"
      value={value}
      variant="outlined"
      suffixIcon={<GlobalOutlined />}
      onChange={(nextLanguage) => {
        void i18n.changeLanguage(nextLanguage)
      }}
      options={[
        { value: 'en', label: t('common.languages.en') },
        { value: 'vi', label: t('common.languages.vi') },
      ]}
    />
  )
}
