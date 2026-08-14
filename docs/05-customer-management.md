# 05 - Customer Management

## Purpose
Manage customer profiles and their rental history for the self-drive car rental business.

## Scope
- Create, view, and update customer records.
- Soft-deactivate customers with `isActive`.
- Permanently delete a customer from the directory when they have no bookings (admin only).
- Link customers to bookings and show rental history.
- Duplicate phone numbers are blocked.

This phase does **not** include license/ID image upload or the `customer-documents` bucket.

## Firestore
Collection: `customers`

Document fields:
- `fullName` (string, required)
- `phoneNumber` (string, required, unique after normalization)
- `email` (optional)
- `governmentId` (optional)
- `driverLicenseNumber` (optional)
- `notes` (optional)
- `isActive` (boolean)
- `createdAt`, `updatedAt`

Firestore rules: active users can read/create/update. Only admins can delete, and the client still blocks delete when any booking references `customerId`.

## Frontend
- Routes (authenticated admin and staff):
  - `/customers` list
  - `/customers/new` create
  - `/customers/:id` edit + booking history
- Components: `CustomerList`, `CustomerForm`
- Booking create still upserts a customer inline. If the phone number already exists, the existing customer is reused.
- Admin delete: `CustomerList` and `CustomerDetailPage` call `deleteCustomerWithGuards`. Bookings and customer snapshots on those bookings are kept. After delete, the phone number can be reused.
- Customers with rental history cannot be deleted. Use `isActive: false` instead.

## Related files
- `src/services/customerService.ts`
- `src/pages/customers/`
- `src/components/customers/`
