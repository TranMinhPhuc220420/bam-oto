import React, { useState } from 'react'
import { App, Button, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import { useTranslation } from 'react-i18next'

import { uploadCarImage } from '../../services/supabaseStorage'

interface CarImageUploadProps {
  value?: string[]
  onChange?: (urls: string[]) => void
}

export const CarImageUpload: React.FC<CarImageUploadProps> = ({ value = [], onChange }) => {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const [fileList, setFileList] = useState<UploadFile[]>(
    value.map((url, index) => ({ uid: String(index), name: `image-${index}`, status: 'done', url }))
  )

  const handleChange: UploadProps['onChange'] = (info) => {
    const newFileList = [...info.fileList]
    setFileList(newFileList)

    if (info.file.status === 'done') {
      message.success(t('cars.upload.success', { fileName: info.file.name }))
      const urls = newFileList.map((file) => file.url || file.response?.url).filter(Boolean) as string[]
      onChange?.(urls)
    } else if (info.file.status === 'error') {
      message.error(t('cars.upload.error', { fileName: info.file.name }))
    }
  }

  const customRequest: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      const url = await uploadCarImage(file as File)
      onSuccess?.({ url })
    } catch (err) {
      onError?.(err as Error)
    }
  }

  return (
    <Upload listType="picture" fileList={fileList} customRequest={customRequest} onChange={handleChange}>
      <Button icon={<UploadOutlined />}>{t('cars.upload.button')}</Button>
    </Upload>
  )
}

