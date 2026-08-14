# 05 - Customer Management

## Purpose
Manage customer profiles and their rental history for the self-drive car rental business.

## Scope
- CRUD for customers (create, view, update, soft-deactivate).
- Link customers to bookings and show rental history.
- Prevent duplicate phone numbers.

## Requirements
- Firestore:
  - Collection: `customers`.
  - Document fields:
    - `fullName`, `phoneNumber`, `email`.
    - `governmentId`, `driverLicenseNumber`, `notes`.
    - `isActive`, `createdAt`, `updatedAt`.
- Frontend:
  - Pages:
    - `/customers` (list).
    - `/customers/new`, `/customers/:id`.
  - Components:
    - `CustomerList`, `CustomerForm`.
  - Ant Design Form, Table, Input + Tailwind CSS.
- Validation:
  - Prevent duplicate phone numbers.
  - Show customer booking history on the detail page.
- Workflow:
  - Creating a booking with a new phone number still creates a customer inline.
  - Creating a booking with an existing phone number reuses that customer.

## Out of scope
- License / ID image upload.
- Supabase `customer-documents` bucket.

## Output
Write the full markdown spec only; do not add extra explanations outside the spec.
