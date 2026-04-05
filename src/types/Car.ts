import type { FieldValue, Timestamp } from 'firebase/firestore';

export type FuelType = 'Gas' | 'Electric';
export type CarStatus = 'available' | 'rented' | 'cleaning' | 'repair';

export interface Car {
  id?: string;
  plateNumber: string;
  brandId?: string;
  brand: string;
  modelId?: string;
  model: string;
  fuelType: FuelType;
  color: string;
  year: number;
  status: CarStatus;
  images: string[];
  note?: string;
  everRented: boolean; // Tracking if the car has ever been rented to lock plateNumber
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}
