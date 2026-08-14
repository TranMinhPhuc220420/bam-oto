# 02 - User Role & Access Management

## Purpose
Define how users with different roles (admin, staff) can access and modify data in the system, based on Firebase Auth state and Firestore roles.

## Scope
- Role‑based permissions for pages and actions.
- Simple permission matrix (what each role can do).
- UI to manage users (list, create, activate/deactivate).

## Requirements
- Firestore:
  - Collection: `users`.
  - Document per user:
    - `authUid` (Firebase Auth UID).
    - `email`.
    - `role` (string: "admin", "staff").
    - `isActive` (boolean).
    - `createdAt`, `updatedAt`.
- Frontend:
  - React + TypeScript, Ant Design, Tailwind CSS.
  - Pages:
    - `/users` (list of users).
    - `/users/new` (form to create user with role selection).
  - Components:
    - `UserList`, `UserForm`, `RoleSelector`.
- Authorization:
  - Use `useAuth` + `role` from Firestore to guard:
    - Admin: can edit cars, bookings, financials, users.
    - Staff: can view and create bookings, view customers, but cannot edit cars or users.
  - Implement `ProtectedRoute` or similar mechanism.
- UI:
  - Show/hide menu items and buttons based on role.
  - Show simple role labels (e.g., “Admin”, “Staff”) in the list.

## Output
Write the full markdown spec only; do not add extra explanations outside the spec.