# 01 - Authentication

## Purpose
Implement a secure authentication layer for the self‑drive car rental web app using Firebase Auth (email/password). Only authenticated users can access admin and staff areas.

## Scope
- Sign‑up, sign‑in, sign‑out flows.
- Password reset and email verification.
- Protected routes for admin pages (e.g., /cars, /bookings, /finance).

## Requirements
- Use Firebase Auth (email/password) for user accounts.
- Frontend:
  - React + TypeScript.
  - Ant Design components for forms and buttons.
  - Tailwind CSS for styling.
- Create:
  - `AuthProvider` component that wraps the app.
  - `useAuth` hook that exposes:
    - `currentUser`, `loading`, `signUp`, `signIn`, `signOut`, `resetPassword`.
  - Pages:
    - `/login` (sign‑in form).
    - `/register` (sign‑up form, only for admins).
    - `/forgot-password` (reset password).
- Redirect users:
  - If already signed‑in, redirect from `/login` to `/cars`.
  - If not signed‑in, block access to admin routes and redirect to `/login`.

## Security and naming
- All variables, functions, and file names must be in English.
- Example Firestore‑side user document (optional, covered more in user‑role):
  - `users/{authUid}` with `authUid`, `email`, `role`, `isActive`.
- Do not hardcode Firebase config; read from environment variables.

## Output
Write the full markdown spec only; do not add extra explanations outside the spec.