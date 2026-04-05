# 02 - User Role & Access Management

## Purpose
Define how users with different roles (admin, staff) can access and modify data in the system, based on Firebase Auth state and Firestore roles.

## Scope
- Role‑based permissions for pages and actions.
- Simple permission matrix (what each role can do).
- UI to manage users (list, create, activate/deactivate).

## Architecture

### Database 
- Firestore Collection: `users`.
- Document (keyed by Firebase `authUid`):
  - `authUid` (string): Firebase Auth UID.
  - `email` (string): User email address.
  - `role` (string): Enum of "admin", "staff".
  - `isActive` (boolean): Whether the user is allowed to sign in.
  - `createdAt` (timestamp).
  - `updatedAt` (timestamp).

### Frontend Routing & Authorization
- **Guard components**: 
  - `ProtectedRoute` evaluates the active user profile's role.
  - Optional `requireAdmin` parameter instantly reroutes staff members from localized administrative views like `/users`.
- **Navigation menus**:
  - Automatically filters entries depending on the active user’s role map, revealing `/users` and `/finance` selectively.

### Key Components & Pages
- **Pages**:
  - `/users` (`UsersPage.tsx`): Dashboard listing all currently onboarded accounts.
  - `/users/new` (`NewUserPage.tsx`): Protected form to provision and register fresh internal accounts.
- **Components**:
  - `UserList` (`UserList.tsx`): Reactively syncs and displays entries from the `users` Firestore collection into an Ant Design data table.
  - `UserForm` (`UserForm.tsx`): Registration logic bridging Firebase Auth (via a sandboxed admin instance so the primary user is not signed out) and the Firestore user profile.
  - `RoleSelector` (`RoleSelector.tsx`): Select dropdown widget isolating role management logic and UI bounds.

## Restrictions
- Admin: Unrestricted. Full read/write access to cars, bookings, financials, and users.
- Staff: Restricted. Can manage bookings and customer data, but cannot see the finance dashboard, edit raw car metadata, or provision new application users.
