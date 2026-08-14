# 00 - Firestore Security Rules

## Purpose
Enforce role-based access in Firestore so the client UI is not the only permission layer.

## Deploy

Rules are **not** deployed by the cPanel FTP workflow. Deploy them with the Firebase CLI after signing in to the same Firebase project used by `VITE_FIREBASE_PROJECT_ID`.

```bash
firebase deploy --only firestore:rules
```

The first administrator document (`users/{authUid}`) must still be created manually in the Firebase console. Rules do not allow a user to bootstrap their own admin profile.

## Access matrix

Rules read `users/{request.auth.uid}` for `role` and `isActive`. Accounts without a profile, or with `isActive: false`, cannot write any collection.

| Collection | Read | Create / Update | Delete |
|---|---|---|---|
| `users` | Own document, or admin list/get | Admin | Admin (Firestore profile only; Auth accounts stay until removed in Firebase Console) |
| `cars`, `carBrands`, `carModels` | Active users | Admin | Admin |
| `bookings` | Active users | Active users | Admin |
| `customers` | Active users | Active users | Admin, only when the customer has no bookings. Otherwise deactivate with `isActive`. |
| `transactions` | Active users | Active users | Admin |

## Client-side checks

Plate uniqueness, catalog name uniqueness, booking overlap, user-delete guards (not self, not last admin), and customer-delete guards (admin only, no booking history) stay in the client. Spark (free) Firebase does not include Cloud Functions, so Auth user deletion is a manual Console step.
