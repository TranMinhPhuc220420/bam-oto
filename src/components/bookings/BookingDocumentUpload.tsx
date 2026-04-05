import { useState } from 'react'
import { App, Button, Typography, Upload } from 'antd'
import { PaperClipOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd/es/upload/interface'
import { useTranslation } from 'react-i18next'

import { deleteBookingDocument, uploadBookingDocument } from '../../services/supabaseStorage'
import { BookingDocumentsPreview } from './BookingDocumentsPreview'

interface BookingDocumentUploadProps {
  value?: string[]
  onChange?: (urls: string[]) => void
  onPersistChange?: (urls: string[]) => Promise<void> | void
  readOnly?: boolean
}

export function BookingDocumentUpload({
  value = [],
  onChange,
  onPersistChange,
  readOnly = false,
}: BookingDocumentUploadProps) {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const [removingUrl, setRemovingUrl] = useState<string | null>(null)

  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'done') {
      const documentUrl = (info.file.response as { url?: string } | undefined)?.url ?? info.file.url

      if (!documentUrl) {
        return
      }

      const nextUrls = Array.from(new Set([...value, documentUrl]))
      message.success(t('bookings.upload.success', { fileName: info.file.name }))
      void syncUrls(nextUrls)
    }

    if (info.file.status === 'error') {
      message.error(t('bookings.upload.error', { fileName: info.file.name }))
    }
  }

  const FILE_TYPE_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.text,.txt,.application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'

  const syncUrls = async (nextUrls: string[]) => {
    onChange?.(nextUrls)

    if (onPersistChange) {
      await onPersistChange(nextUrls)
    }
  }

  const customRequest: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      const url = await uploadBookingDocument(file as File)
      onSuccess?.({ url })
    } catch (error) {
      onError?.(error as Error)
    }
  }

  const handleRemove = async (url: string) => {
    setRemovingUrl(url)

    try {
      await deleteBookingDocument(url)
      await syncUrls(value.filter((entry) => entry !== url))
      message.success(t('bookings.upload.removeSuccess'))
    } catch (error) {
      console.error('Error removing booking document:', error)
      message.error(t('bookings.upload.removeError'))
    } finally {
      setRemovingUrl(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
        <div>
          <Typography.Text className="block text-sm font-medium text-slate-900">
            {value.length ? t('bookings.upload.count', { count: value.length }) : t('bookings.upload.empty')}
          </Typography.Text>
          <Typography.Text className="text-xs text-slate-500">
            {t('bookings.upload.helper')}
          </Typography.Text>
        </div>

        {!readOnly ? (
          <Upload accept={FILE_TYPE_ACCEPT} multiple showUploadList={false} customRequest={customRequest} onChange={handleChange}>
            <Button icon={value.length ? <PaperClipOutlined /> : <UploadOutlined />}>
              {value.length ? t('bookings.upload.uploadMore') : t('bookings.upload.upload')}
            </Button>
          </Upload>
        ) : null}
      </div>

      <BookingDocumentsPreview
        urls={value}
        emptyText={t('bookings.upload.previewEmpty')}
        removingUrl={removingUrl}
        onRemove={
          readOnly
            ? undefined
            : (url) => {
                void handleRemove(url)
              }
        }
      />
    </div>
  )
}
