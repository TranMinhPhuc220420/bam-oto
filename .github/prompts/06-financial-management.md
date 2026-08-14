# 06 - Financial Management

## Purpose
Track revenue, payments, and generate basic financial reports for the car rental business.

## Scope
- Record transactions and invoices.
- Summarize revenue by day/week/month.
- Store invoice PDFs in Supabase.

## Requirements
- Firestore:
  - Collections:
    - `transactions`:
      - `bookingId`, `amount`, `paymentMethod` ("cash", "transfer", "card", "e‑wallet").
      - `status` ("pending", "paid", "refunded").
      - `createdAt`.
    - `invoices`:
      - `transactionId`, `pdfUrl` (Supabase), `issueDate`, `dueDate`.
- Supabase Storage:
  - Bucket: `financial-documents`.
  - Store PDF invoices; Firestore stores URL.
- Frontend:
  - Pages:
    - `/finance` (dashboard).
    - `/finance/transactions`, `/finance/invoices`.
  - Components:
    - `TransactionList`, `InvoiceList`, `ReportDashboard`.
  - Ant Design Table, Card, Statistic + Tailwind CSS.
- Logic:
  - When a booking is marked as paid, create a transaction and optionally an invoice.
  - Provide simple charts or number cards: daily revenue, total revenue, number of completed bookings.
- Naming:
  - Use English for all variables and functions (e.g., `totalRevenue`, `dailyRevenueChart`).

## Output
Write the full markdown spec only; do not add extra explanations outside the spec.