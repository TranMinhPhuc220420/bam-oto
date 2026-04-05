# GitHub Copilot Instructions for bam.plt.pro.vn project

## Project overview
- This is a web application for a self‑drive car rental business.
- The frontend is built with React (TypeScript), Ant Design (Antd), and Tailwind CSS.
- Backend & infrastructure:
  - Firebase Firestore is used as the main database (collections: cars, bookings, customers, users, transactions, etc.).
  - Supabase Storage is used for file storage (car images, customer documents, invoices). Firebase documents store only URLs to files.
- Authentication is handled by Firebase Auth (email/password).
- After build, the React app will be deployed to the domain: bam.plt.pro.vn (static hosting or reverse proxy).

## How to respond
- All responses must be in English.
- All code samples, function names, variables, comments, and file names must be in English.
- When generating code:
  - Use TypeScript with React.
  - Use Ant Design components when appropriate (Form, Table, Input, Upload, Button, etc.).
  - Style with Tailwind CSS classes instead of custom CSS files.
- When writing specs or create‑instructions:
  - Be explicit about:
    - Firestore collection names and document structures.
    - Supabase bucket names and file conventions.
    - Routes and component names (e.g., /cars, /bookings, /login).
  - Assume Firebase Auth is already configured in the project.

## Folder and file conventions
- Keep a consistent structure:
  - src/
    - pages/ (e.g., LoginPage, CarListPage, BookingListPage)
    - components/ (e.g., CarForm, BookingForm, UserForm)
    - hooks/ (e.g., useAuth, useFirestoreData)
    - services/ (e.g., firebase.ts, supabaseStorage.ts)
    - types/ (e.g., Car.ts, Booking.ts, User.ts)
- Use kebab‑case for folder names and PascalCase for React component files.
- Use .md files for documentation/specs (e.g., 01-authentication.md, 02-user-role-management.md, ...).

## Security and auth
- When generating auth‑related code:
  - Use Firebase Auth for sign‑in, sign‑out, and password reset.
  - Implement a React AuthProvider and useAuth hook.
  - Protect routes by role (e.g., admin vs staff) using Firebase Auth state + Firestore user roles.
- Do not store passwords or sensitive data in plain text. Assume Firebase Auth handles that.

## Deployment and hosting
- Assume the production build is created with:
  - `npm run build` (or `yarn build`).
  - The output folder is `dist/` or `build/`.
- The final build must be served on the domain: bam.plt.pro.vn (via static hosting or a reverse proxy; do not hardcode other hosts).
- When generating deployment scripts or config, keep host references generic if possible (e.g., use `process.env.REACT_APP_PUBLIC_DOMAIN` instead of embedding the domain directly in code logic).

## Tone and style
- Be concise and practical.
- Prefer code examples with clear naming and minimal comments.
- When writing markdown specs, use bullet lists and small sections for each requirement.

## Internationalization (i18n) rules
- All user-facing text must use the i18n layer in `src/i18n/resources.ts`; do not hardcode visible labels, buttons, alerts, empty states, upload messages, table headers, placeholders, helper text, or download text directly in components.
- Whenever adding a new feature or UI state, always create both English and Vietnamese translation keys at the same time and reference them via `useTranslation()` / `t(...)`.
- Dynamic notifications must also use i18n interpolation (for example: `t('bookings.upload.success', { fileName })`) instead of string templates written inline.
- Before finishing any UI change, quickly check for hardcoded text and move it into i18n if found.
- Prefer feature-scoped translation namespaces such as `cars.*`, `bookings.*`, `users.*`, and `common.*` to keep keys organized and maintainable.