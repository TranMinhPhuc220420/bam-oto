import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function uploadFileToBucket(bucketName: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file)

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName)

  return data.publicUrl
}

function getStoragePathFromPublicUrl(bucketName: string, publicUrl: string) {
  try {
    const url = new URL(publicUrl)
    const marker = `/storage/v1/object/public/${bucketName}/`
    const pathStart = url.pathname.indexOf(marker)

    if (pathStart === -1) {
      return null
    }

    return decodeURIComponent(url.pathname.slice(pathStart + marker.length))
  } catch {
    return null
  }
}

async function removeFileFromBucket(bucketName: string, publicUrl: string) {
  const filePath = getStoragePathFromPublicUrl(bucketName, publicUrl)

  if (!filePath) {
    throw new Error(`Unable to resolve ${bucketName} storage path from URL.`)
  }

  const { error } = await supabase.storage.from(bucketName).remove([filePath])

  if (error) {
    throw error
  }
}

export const uploadCarImage = async (file: File): Promise<string> => uploadFileToBucket('car-images', file)
export const deleteCarImage = async (publicUrl: string) => removeFileFromBucket('car-images', publicUrl)

export const uploadBookingDocument = async (file: File): Promise<string> =>
  uploadFileToBucket('booking-documents', file)
export const deleteBookingDocument = async (publicUrl: string) =>
  removeFileFromBucket('booking-documents', publicUrl)

