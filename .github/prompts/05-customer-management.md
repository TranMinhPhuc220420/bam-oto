# 05 - Customer Management

## Purpose
Manage customer profiles and their rental history for the self‑drive car rental business.

## Scope
- CRUD for customers.
- Upload and store license / ID images.
- Link customers to bookings.

## Requirements
- Firestore:
  - Collection: `customers`.
  - Sample document:
    - `name`, `phone`, `email`.
    - `licenseNumber`, `licenseExpiry`.
    - `licenseImageRef` (URL from Supabase).
    - `createdAt`, `updatedAt`.
- Supabase Storage:
  - Bucket: `customer-documents`.
  - Store license images and ID scans.
- Frontend:
  - Pages:
    - `/customers` (list).
    - `/customers/new`, `/customers/:id`.
  - Components:
    - `CustomerList`, `CustomerForm`, `LicenseUpload`.
  - Ant Design Form, Upload, Input + Tailwind CSS.
- Validation:
  - Prevent duplicate license numbers if business policy requires it.
  - Show customer history (e.g., list of past bookings).
- Workflow:
  - When creating a customer, upload license image to Supabase → store URL in `licenseImageRef`.

## Output
Write the full markdown spec only; do not add extra explanations outside the spec.