# 02 - User Role & Access Management

## Purpose
Define how users with different roles (admin, staff) can access and modify data in the system, based on Firebase Auth state and Firestore roles.

## Scope
- Role‑based permissions for pages and actions.
- Simple permission matrix (what each role can do).
- UI to manage users (list, create, activate/deactivate, delete).

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
  - `UserList` (`UserList.tsx`): Reactively syncs and displays entries from the `users` Firestore collection into an Ant Design data table. Admins can activate/deactivate accounts and delete users from the directory.
  - `UserForm` (`UserForm.tsx`): Registration logic bridging Firebase Auth (via a sandboxed admin instance so the primary user is not signed out) and the Firestore user profile.
  - `RoleSelector` (`RoleSelector.tsx`): Select dropdown widget isolating role management logic and UI bounds.
- **Services**:
  - `userService.ts`: Client-side delete guards and Firestore document deletion.

### Delete user
Spark (free) Firebase does not support Cloud Functions, so the client cannot delete another user's Auth account. Delete removes only `users/{authUid}`:

1. Caller must be an authenticated admin (enforced by Firestore rules and the UI).
2. An admin cannot delete their own account.
3. The last administrator (`role == admin`) cannot be deleted, even if inactive.
4. The Firestore profile is deleted. The user can no longer use the app (`ProtectedRoute` requires a profile).
5. The Firebase Auth account remains until an admin deletes it in Firebase Console → Authentication → Users. That step is required before the same email can be registered again.
6. Bookings, customers, cars, and transactions are not cascaded.

Toggle `isActive` remains the way to temporarily block sign-in without removing the directory entry.

## Restrictions
- Admin: Unrestricted. Full read/write access to cars, bookings, financials, and users.
- Staff: Restricted. Can manage bookings and customer data, but cannot see the finance dashboard, edit raw car metadata, or provision or delete application users.
