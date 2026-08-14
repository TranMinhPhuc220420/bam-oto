# 03 - Car Management

## Purpose
Allow admin and staff to manage the fleet of self‑drive cars (add, view, edit, status tracking, image upload).

## Scope
- CRUD for cars.
- Status tracking (available, rented, cleaning, repair).
- Image upload via Supabase Storage.

## Requirements
- Firestore:
  - Collection: `cars`.
  - Sample document:
    - `plateNumber` (string, required, unique).
    - `brand`, `model`, `fuelType` ("Gas" or "Electric").
    - `color`, `year` (number).
    - `status` ("available", "rented", "cleaning", "repair").
    - `images` (array of file URLs).
    - `note` (optional), `createdAt`, `updatedAt`.
- Supabase Storage:
  - Bucket: `car-images`.
  - File types: image/jpeg, image/png.
  - Rules: "admin" can upload/delete; "staff" can read.
- Frontend:
  - Pages:
    - `/cars` (list of cars).
    - `/cars/new`, `/cars/edit/:id`.
  - Components:
    - `CarList`, `CarForm`, `CarImageUpload`.
  - Ant Design Table, Form, Upload, Input, Select + Tailwind CSS.
- Validation:
  - `plateNumber` cannot be changed once saved if the car has ever been rented.
  - `fuelType` only allows "Gas" or "Electric".
- Workflow:
  - Admin uploads car image → stored in Supabase → URL stored in `images` array in Firestore.
  - Status changes are logged in Firestore.

## Output
Write the full markdown spec only; do not add extra explanations outside the spec.