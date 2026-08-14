# 01 - Authentication

## Purpose
Implement a secure authentication layer for the self-drive car rental web app using Firebase Auth with email/password sign-in. Only authenticated users can access admin and staff routes.

## Stack
- React 19 with TypeScript.
- Ant Design for forms, layout, navigation, and feedback.
- Tailwind CSS utility classes for page styling and responsive layout.
- Firebase Auth for account lifecycle.
- Firestore for user profile documents in the `users` collection.

## Routes
- `/login`: Public sign-in page.
- `/forgot-password`: Public password reset page.
- `/dashboard`, `/cars`, `/bookings`, `/customers`: Protected routes for authenticated users.
- `/finance`, `/users`, `/users/new`, `/cars/new`, `/cars/edit/:id`, `/cars/catalog`: Protected routes for authenticated admin users only.

## Environment Variables
The app reads Firebase settings from Vite environment variables.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Core Components
- `AuthProvider`: Watches Firebase Auth state and loads `users/{authUid}` from Firestore.
- `useAuth`: Exposes `currentUser`, `profile`, `loading`, `signIn`, `signUp`, `signOut`, and `resetPassword`.
- `ProtectedRoute`: Redirects unauthenticated users to `/login`, blocks inactive accounts, and optionally requires the `admin` role.
- `PublicOnlyRoute`: Redirects authenticated users away from public auth pages to `/dashboard`.
- `AppShell`: Shared authenticated layout with sidebar navigation and sign-out action.

## Firestore Structure
Collection: `users`

Document path:
- `users/{authUid}`

Document fields:
- `authUid`: Firebase Auth user id.
- `email`: Primary login email.
- `role`: `admin` or `staff`.
- `isActive`: Boolean used to allow or block access.
- `createdAt`: Firestore server timestamp.
- `updatedAt`: Firestore server timestamp.

## Authentication Flows
### Sign in
- User opens `/login`.
- Successful sign-in redirects to `/dashboard`.
- If the user originally requested a protected route, the app redirects back to that route.

### Register user
- Only authenticated users with `role: admin` can access `/users/new`.
- Registration uses a secondary Firebase app instance so the current admin session is not replaced.
- The flow creates a Firebase Auth user, writes `users/{authUid}`, and requests an email verification message.

### Delete user
- Only authenticated users with `role: admin` can access `/users` and delete accounts.
- Delete removes the `users/{authUid}` Firestore document so the person can no longer use the app.
- Spark (free) Firebase cannot delete another Auth account from the client. To reuse the email, delete the user in Firebase Console → Authentication → Users.
- An admin cannot delete their own account or the last remaining administrator.
- Deactivate (`isActive: false`) remains available for a temporary lockout.
- Related bookings, customers, and cars are kept.

### Password reset
- `/forgot-password` sends a Firebase Auth reset email.

### Protected routes
- Unauthenticated users are redirected to `/login`.
- Authenticated users without a Firestore profile are blocked until `users/{authUid}` exists.
- Users with `isActive: false` are denied access.

## Implementation Notes
- The initial administrator account still needs a matching Firestore document created manually or by a bootstrap script.
- Email verification is requested on account creation and shown in the authenticated UI as a pending status when not yet completed.
- Firestore security rules live in `firestore.rules` and must be deployed with the Firebase CLI. See `docs/00-firestore-security.md`.

## Acceptance Criteria
- Users can sign in with Firebase email/password on `/login`.
- Admin users can create new users from `/users/new` without losing their own session.
- Password reset works from `/forgot-password`.
- `/cars`, `/bookings`, and `/finance` redirect to `/login` when there is no authenticated user.
- `/users/new` is only accessible to authenticated admin users.
- Admin users can remove other users from `/users`, except themselves and the last administrator. Auth accounts must be deleted in Firebase Console to reuse an email.
- Firebase configuration is loaded only from environment variables.
