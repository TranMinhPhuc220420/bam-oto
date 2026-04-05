import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from './firebase'

export interface SaveCarBrandInput {
  name: string
  isActive: boolean
}

export interface SaveCarModelInput {
  brandId: string
  name: string
  isActive: boolean
}

export function normalizeCatalogName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isCatalogDuplicateError(error: unknown, code: string) {
  return error instanceof Error && error.message === code
}

export async function saveCarBrand(values: SaveCarBrandInput, brandId?: string) {
  const normalizedName = normalizeCatalogName(values.name)
  const duplicateSnapshot = await getDocs(
    query(collection(db, 'carBrands'), where('normalizedName', '==', normalizedName))
  )
  const hasDuplicate = duplicateSnapshot.docs.some((brandDoc) => brandDoc.id !== brandId)

  if (hasDuplicate) {
    throw new Error('catalog/brand-duplicate')
  }

  const payload = {
    name: values.name.trim(),
    normalizedName,
    isActive: values.isActive,
    updatedAt: serverTimestamp(),
  }

  if (brandId) {
    await updateDoc(doc(db, 'carBrands', brandId), payload)
    return {
      id: brandId,
      ...payload,
    }
  }

  const createdDoc = await addDoc(collection(db, 'carBrands'), {
    ...payload,
    createdAt: serverTimestamp(),
  })

  return {
    id: createdDoc.id,
    ...payload,
  }
}

export async function saveCarModel(values: SaveCarModelInput, modelId?: string) {
  const normalizedName = normalizeCatalogName(values.name)
  const duplicateSnapshot = await getDocs(
    query(
      collection(db, 'carModels'),
      where('brandId', '==', values.brandId),
      where('normalizedName', '==', normalizedName)
    )
  )
  const hasDuplicate = duplicateSnapshot.docs.some((modelDoc) => modelDoc.id !== modelId)

  if (hasDuplicate) {
    throw new Error('catalog/model-duplicate')
  }

  const payload = {
    brandId: values.brandId,
    name: values.name.trim(),
    normalizedName,
    isActive: values.isActive,
    updatedAt: serverTimestamp(),
  }

  if (modelId) {
    await updateDoc(doc(db, 'carModels', modelId), payload)
    return {
      id: modelId,
      ...payload,
    }
  }

  const createdDoc = await addDoc(collection(db, 'carModels'), {
    ...payload,
    createdAt: serverTimestamp(),
  })

  return {
    id: createdDoc.id,
    ...payload,
  }
}
