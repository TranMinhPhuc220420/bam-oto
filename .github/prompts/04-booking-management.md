# 04 - Booking Management

## Purpose
Manage self‑drive car rentals: bookings, schedules, status, and linking to cars and customers.

## Scope
- Create, view, edit, cancel bookings.
- Check availability (no overlapping bookings for the same car).
- Store optional documents (e.g., rental agreement) in Supabase.

## Requirements
- Firestore:
  - Collection: `bookings`.
  - Sample document:
    - `carId` (reference to `cars`).
    - `customerId` (reference to `customers`).
    - `startDate`, `endDate` (timestamps).
    - `pickupLocation`, `returnLocation`.
    - `status` ("draft", "confirmed", "in‑progress", "completed", "canceled").
    - `totalPrice`, `paymentStatus`.
    - `documentUrl` (optional, from Supabase).
- Supabase Storage:
  - Bucket: `booking-documents`.
  - Store PDF/contract files; Firestore stores URL.
- Frontend:
  - Pages:
    - `/bookings` (list, with calendar view or filters).
    - `/bookings/new`, `/bookings/edit/:id`.
  - Components:
    - `BookingList`, `BookingForm`, `BookingCalendar` (optional).
  - Use Ant Design DatePicker, Table, Form + Tailwind CSS.
- Logic:
  - When creating/editing a booking, check if the car is available in the requested time range.
  - Status transitions: draft → confirmed → in‑progress → completed/canceled.

## Output
Write the full markdown spec only; do not add extra explanations outside the spec.