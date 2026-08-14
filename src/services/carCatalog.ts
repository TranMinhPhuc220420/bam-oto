import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from './firebase'
import type { CarBrand } from '../types/Brand'
import type { Car } from '../types/Car'
import type { CarModel } from '../types/Model'
import type { UserRole } from '../types/User'

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

export interface CatalogDeleteEligibilityResult {
  allowed: boolean
  reasonKey?: string
}

type CatalogCarRef = Pick<Car, 'brandId' | 'brand' | 'modelId' | 'model'>

function brandKey(brand: Pick<CarBrand, 'name' | 'normalizedName'>) {
  return brand.normalizedName || normalizeCatalogName(brand.name)
}

function modelKey(model: Pick<CarModel, 'name' | 'normalizedName'>) {
  return model.normalizedName || normalizeCatalogName(model.name)
}

export function carUsesBrand(
  car: CatalogCarRef,
  brand: Pick<CarBrand, 'id' | 'name' | 'normalizedName'>,
) {
  if (brand.id && car.brandId === brand.id) {
    return true
  }

  if (car.brandId) {
    return false
  }

  return normalizeCatalogName(car.brand ?? '') === brandKey(brand)
}

export function carUsesModel(
  car: CatalogCarRef,
  model: Pick<CarModel, 'id' | 'brandId' | 'name' | 'normalizedName'>,
  brand?: Pick<CarBrand, 'id' | 'name' | 'normalizedName'> | null,
) {
  if (model.id && car.modelId === model.id) {
    return true
  }

  if (car.modelId) {
    return false
  }

  if (normalizeCatalogName(car.model ?? '') !== modelKey(model)) {
    return false
  }

  if (car.brandId) {
    return car.brandId === model.brandId
  }

  if (brand) {
    return carUsesBrand(car, brand)
  }

  return false
}

export function canDeleteCarBrand(
  brand: Pick<CarBrand, 'id' | 'name' | 'normalizedName'>,
  cars: CatalogCarRef[],
  role?: UserRole | null,
): CatalogDeleteEligibilityResult {
  if (role !== 'admin') {
    return { allowed: false, reasonKey: 'brands.messages.deleteError' }
  }

  if (!brand.id) {
    return { allowed: false, reasonKey: 'brands.messages.deleteError' }
  }

  if (cars.some((car) => carUsesBrand(car, brand))) {
    return { allowed: false, reasonKey: 'brands.messages.deleteBlockedInUse' }
  }

  return { allowed: true }
}

export function canDeleteCarModel(
  model: Pick<CarModel, 'id' | 'brandId' | 'name' | 'normalizedName'>,
  cars: CatalogCarRef[],
  options: {
    role?: UserRole | null
    brand?: Pick<CarBrand, 'id' | 'name' | 'normalizedName'> | null
  } = {},
): CatalogDeleteEligibilityResult {
  if (options.role !== 'admin') {
    return { allowed: false, reasonKey: 'models.messages.deleteError' }
  }

  if (!model.id) {
    return { allowed: false, reasonKey: 'models.messages.deleteError' }
  }

  if (cars.some((car) => carUsesModel(car, model, options.brand))) {
    return { allowed: false, reasonKey: 'models.messages.deleteBlockedInUse' }
  }

  return { allowed: true }
}

async function loadCatalogCars(): Promise<CatalogCarRef[]> {
  const snapshot = await getDocs(collection(db, 'cars'))

  return snapshot.docs.map((carDoc) => {
    const data = carDoc.data()

    return {
      brandId: typeof data.brandId === 'string' ? data.brandId : undefined,
      brand: typeof data.brand === 'string' ? data.brand : '',
      modelId: typeof data.modelId === 'string' ? data.modelId : undefined,
      model: typeof data.model === 'string' ? data.model : '',
    }
  })
}

export async function deleteCarBrandWithGuards(
  brand: Pick<CarBrand, 'id' | 'name' | 'normalizedName'>,
  role?: UserRole | null,
): Promise<CatalogDeleteEligibilityResult> {
  if (!brand.id) {
    return { allowed: false, reasonKey: 'brands.messages.deleteError' }
  }

  const cars = await loadCatalogCars()
  const eligibility = canDeleteCarBrand(brand, cars, role)

  if (!eligibility.allowed) {
    return eligibility
  }

  const modelsSnapshot = await getDocs(query(collection(db, 'carModels'), where('brandId', '==', brand.id)))
  await Promise.all(modelsSnapshot.docs.map((modelDoc) => deleteDoc(modelDoc.ref)))
  await deleteDoc(doc(db, 'carBrands', brand.id))

  return { allowed: true }
}

export async function deleteCarModelWithGuards(
  model: Pick<CarModel, 'id' | 'brandId' | 'name' | 'normalizedName'>,
  options: {
    role?: UserRole | null
    brand?: Pick<CarBrand, 'id' | 'name' | 'normalizedName'> | null
  } = {},
): Promise<CatalogDeleteEligibilityResult> {
  if (!model.id) {
    return { allowed: false, reasonKey: 'models.messages.deleteError' }
  }

  const cars = await loadCatalogCars()
  const eligibility = canDeleteCarModel(model, cars, options)

  if (!eligibility.allowed) {
    return eligibility
  }

  await deleteDoc(doc(db, 'carModels', model.id))

  return { allowed: true }
}
