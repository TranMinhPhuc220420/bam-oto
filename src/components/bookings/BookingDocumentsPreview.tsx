import { CloseCircleOutlined, DownloadOutlined, FileImageOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons'
import { Empty, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

interface BookingDocumentsPreviewProps {
  urls?: string[]
  compact?: boolean
  emptyText?: string
  onRemove?: (url: string) => void
  removingUrl?: string | null
}

const { Text } = Typography

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(?:$|[?#])/i.test(url)
}

function isPdfUrl(url: string) {
  return /\.pdf(?:$|[?#])/i.test(url)
}

function getDocumentName(url: string, index: number) {
  try {
    const pathname = new URL(url).pathname
    return decodeURIComponent(pathname.split('/').pop() || `document-${index + 1}`)
  } catch {
    return `document-${index + 1}`
  }
}

function renderFileIcon(url: string) {
  if (isImageUrl(url)) {
    return <FileImageOutlined />
  }

  if (isPdfUrl(url)) {
    return <FilePdfOutlined />
  }

  return <FileTextOutlined />
}

export function BookingDocumentsPreview({
  urls = [],
  compact = false,
  emptyText,
  onRemove,
  removingUrl,
}: BookingDocumentsPreviewProps) {
  const { t } = useTranslation()
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)))

  if (!uniqueUrls.length) {
    if (compact) {
      return <Text className="text-xs text-slate-400">{emptyText ?? t('bookings.upload.previewEmptyCompact')}</Text>
    }

    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText ?? t('bookings.upload.previewEmpty')} />
  }

  return (
    <div className={compact ? 'space-y-2' : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'}>
      {uniqueUrls.map((url, index) => {
        const fileName = getDocumentName(url, index)
        const isImage = isImageUrl(url)

        return (
          <div
            key={`${url}-${index}`}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-teal-300 hover:shadow-sm"
          >
            <a href={url} target="_blank" rel="noreferrer" download className="shrink-0">
              {isImage ? (
                <img src={url} alt={fileName} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-2xl text-slate-600">
                  {renderFileIcon(url)}
                </div>
              )}
            </a>

            <div className="min-w-0 flex-1">
              <p className="mb-1 truncate text-sm font-medium text-slate-900">{fileName}</p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-1 text-xs text-teal-700"
              >
                <DownloadOutlined />
                <span>{t('bookings.upload.download')}</span>
              </a>
            </div>

            {onRemove ? (
              <button
                type="button"
                disabled={removingUrl === url}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => onRemove(url)}
                aria-label={t('bookings.upload.removeAria', { fileName })}
              >
                <CloseCircleOutlined />
              </button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
