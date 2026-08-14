# Design — PLT Thuê xe

Locked design system. Future Hallmark runs read this file first; pages defer
to it. Amend intentionally — the file is the rule.

/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */

## System

- Genre · modern-minimal
- Macrostructure family · Workbench (app pages)
- Theme · existing product (teal Ant Design — do not rotate catalog themes)
- Audience · staff and admin running a self-drive rental desk
- Tone · utilitarian — name the job, not a feeling

## Tokens (preserve — do not restyle)

Source of truth is [`src/index.css`](src/index.css) and Ant Design tokens in [`src/App.tsx`](src/App.tsx).

- Accent / primary · `#0f766e`
- Ink · `#0f172a`
- Muted · `#475569`
- Paper · `#f8fafc` with white containers
- Display · Space Grotesk 600
- Body · Source Sans 3 400
- Radius · 16 / 24 (Ant Design `borderRadius` / `borderRadiusLG`)
- Motion · existing hover only; no new reveal choreography

## Copy voice

Operational Vietnamese first. English keeps industry “booking”. Never market the tool.

### Glossary (VI)

- App name · Thuê xe
- Company · PLT Solutions
- Menu · Tổng quan · Đơn thuê · Khách hàng · Xe · Danh mục xe · Tài chính · Nhân sự
- One rental record · **đơn thuê** (never “booking”, “đặt xe”, or “chuyến thuê” in UI)
- Status · Nháp · Đã xác nhận · Đang thuê · Hoàn tất · Đã hủy
  - Nháp — chưa khóa lịch, có thể sửa hoặc xóa
  - Đã xác nhận — đã cọc, chờ giao xe
  - Đang thuê — xe đã giao cho khách
  - Hoàn tất — đã nhận xe về
  - Đã hủy — không còn hiệu lực

### Banned in user-facing copy

Firebase, Firestore, Supabase, route paths (`/cars`), production, pipeline, command center, “không gian cao cấp”, “ảnh chụp nhanh”.

### Patterns

- Buttons use the verb: `Tạo đơn thuê`, `Lưu đơn thuê`, `Giao xe`
- Empty states: what is empty · why it matters · one next action
- Errors: what happened · what to do next
- Page titles are short nouns. One-line subtitle names the job, not the product mood

## CTA voice

- Primary · filled teal, rounded-full, verb + object
- Secondary · default outline, same radius
- Silent success via Ant Design `message` — no celebratory toasts

## What pages MUST share

- Wordmark: logo + Thuê xe + PLT Solutions
- Teal accent, Space Grotesk headings, Source Sans 3 body
- AppShell title as the only page heading (no second hero title)

## What pages MAY differ on

- Metric density and list vs calendar on bookings
- Admin-only finance / catalog / users blocks

## Per-page allowances

- App pages MUST NOT use marketing enrichment or PageHero banners
- Login MAY keep the existing split layout; copy stays operational
