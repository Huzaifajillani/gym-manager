# APEX GYM - Full-Stack Gym Management & Member Retention Operating System

A modern, production-grade gym management web application built with **Spring Boot (Java 17+)**, **React.js + Tailwind CSS**, and **MongoDB** (database: `gym_manager_db`, compatible with MongoDB Compass).

---

## 🏋️‍♂️ Highlights & Core Architecture

- **Dark Athletic Gym Aesthetic**: High-contrast slate charcoal (`#0a0d14`, `#111622`), glowing neon accents (Gold `#eab308`, Emerald `#22c55e`, Crimson `#ef4444`, Cyan `#06b6d4`), responsive mobile-first navigation.
- **Spring Boot 3.2+ Backend**: RESTful APIs, Spring Data MongoDB, BCrypt password hashing, stateless JWT authentication, and CORS security.
- **Embedded MongoDB Wire-Protocol Server**: Out-of-the-box in-memory fallback on port `27017` ensuring MongoDB Compass compatibility without requiring pre-installed MongoDB binaries. If local MongoDB service is running, it connects automatically.
- **Scheduled Automations (`@Scheduled`)**:
  - `9:00 AM`: Daily Expiry Reminder Job (scans 7-day, 3-day, and today expiries, checks privacy consent, dispatches WhatsApp template).
  - `8:00 AM`: Daily No-Show Red-List Scanner (tracks active members absent 10+ days without duplicate case creation).
  - `9:00 PM`: Daily Owner Summary Report (compiles total, active, expired, pending dues, check-ins, and red-list cases into structured log/email payload).
- **Retention & Churn Prevention Engine**:
  - Automatically isolates active members absent 10+ days into tiers: **10–14 days**, **15–21 days**, **22+ days**.
  - Logs staff follow-up outcomes (*Will return, Injured, Travelling, Timing issue, Unhappy, No response, Cancelled*).
  - **Auto-resolves** the red-list case when the member visits and checks in.
- **Gate Turnstile QR Scanner & Protection**:
  - Instant gate check-in simulation with 2-hour duplicate scan protection.
  - Expired and Paused membership blocking.
  - Fair streak counter logic (1 rest day does not reset streak; pauses preserve record).
- **Payments & Renewals Ledger**:
  - Idempotent Cash/UPI front-desk settlement.
  - Accurate expiry date extension (chains from current expiry if active, or from today if already expired).
  - Generates official tax receipt ID (`REC-YYYYMMDD-XXXX`) and printable receipt view.
  - Simulated Razorpay / Stripe webhook processing (`/api/webhooks/payment`).

---

## 👥 Demo User Credentials

| Role | Identifier / Email | Password | Pre-configured Data |
|---|---|---|---|
| **Admin / Owner** | `admin@gym.com` or `+19876543210` | `admin123` | Full administrative control, KPI reports, member management, red-list intervention |
| **Member (Active)** | `john@example.com` or `+1555010001` | `member123` | John Doe (`GYM-001`), Gold Plan, 5-day workout streak |
| **Member (Expiring Soon)** | `michael@example.com` or `+1555010003` | `member123` | Michael Scott (`GYM-003`), Bronze Plan expiring in 3 days |
| **Member (Expired)** | `jim@example.com` or `+1555010005` | `member123` | Jim Halpert (`GYM-005`), Expired 5 days ago (Gate access blocked) |
| **Member (Red-List Absent)** | `stanley@example.com` or `+1555010007` | `member123` | Stanley Hudson (`GYM-007`), Absent 11 days (Auto-resolves upon check-in) |

---

## 🗺️ Page Structure (9 Complete Pages)

### A. Auth & Public Pages
1. **Login Page (`/login`)**: Role-based login via Email or Phone Number with one-click demo role prefill chips.
2. **Public Walk-in Registration (`/register-member`)**: Quick walk-in enrollment form with auto-formatted phone, plan picker, live month-end clamped expiry preview, and mandatory WhatsApp notification consent. Saves as `Pending` payment.

### B. Admin / Owner Portal
3. **Admin Dashboard (`/admin/dashboard`)**: 6 Top KPI cards, today's/upcoming expiring memberships list, real-time gate attendance feed, and a "Trigger Daily Summary Report" on-demand button.
4. **Members & Plans Management (`/admin/members`)**: Searchable/filterable member directory (All, Active, Expired, Paused, Pending Payment), Edit profile, Pause/Freeze (Medical/Travel), Assisted Check-in (mandatory staff reason), Delete, and Plans Configuration section (create/edit plans).
5. **No-Show Red List (`/admin/red-list`)**: 10+ days absent members filterable by 10-14, 15-21, and 22+ days, quick "Send WhatsApp" simulated template action, "Log Follow-up Outcome" modal, and auto-resolution explanation.
6. **Payments & Renewals Ledger (`/admin/payments`)**: Filterable transaction log (All, Paid, Pending, Failed, Refunded), "Mark Cash/UPI Paid" button that generates official receipt ID and extends expiry accurately, and printable tax invoice receipt modal.

### C. Member Portal
7. **Member Home & QR Check-in (`/member/home`)**: Digital VIP gate pass card, days remaining meter, weekly workout goal progress bar, fair streak counter, turnstile QR scanner simulation with 2-hour duplicate cooldown protection, and live attendance history.
8. **Membership Renewal (`/member/renew`)**: Displays current status, renewal options (3, 6, 12 months) with base price, discount, and net payable fee, simulated Razorpay/Stripe checkout modal, idempotent webhook endpoint processing, and downloadable receipt.
9. **Add-ons Store & Privacy Settings (`/member/addons`)**: Add-ons categorized into Personal Training (PT), Diet Plans, and Protein & Supplements (never pre-selected). Buy add-on flow, active session countdown tracker, and WhatsApp/Email privacy toggle switch with instant backend synchronization.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate with Email or Phone + Password | Public |
| `GET` | `/api/auth/me` | Current authenticated user profile | Authenticated |
| `POST` | `/api/members/register-public` | Walk-in registration (saves as Pending) | Public |
| `GET` | `/api/members` | Filterable member directory | Admin |
| `PUT` | `/api/members/{id}` | Update member details | Admin |
| `POST` | `/api/members/{id}/pause` | Freeze membership (Medical/Travel) | Admin |
| `POST` | `/api/members/{id}/resume` | Resume paused membership | Admin |
| `PUT` | `/api/members/{id}/consent` | Toggle WhatsApp notification consent | Authenticated |
| `POST` | `/api/attendance/qr-check-in` | Member gate QR check-in (2h duplicate lock) | Authenticated |
| `POST` | `/api/attendance/assisted-check-in/{id}` | Staff assisted check-in with reason | Admin |
| `GET` | `/api/red-list` | Absent members (ranges: All, 10-14, 15-21, 22+) | Admin |
| `POST` | `/api/red-list/{id}/follow-up` | Log follow-up outcome | Admin |
| `POST` | `/api/red-list/{id}/send-reminder` | Dispatch WhatsApp template reminder | Admin |
| `POST` | `/api/red-list/scan-now` | Manual trigger for scanner | Admin |
| `GET` | `/api/payments` | Full transaction ledger | Admin |
| `POST` | `/api/payments/mark-paid/{memberId}` | Mark Cash/UPI paid & extend expiry | Admin |
| `POST` | `/api/webhooks/payment` | Payment gateway webhook (idempotent) | Public |
| `GET` | `/api/reports/dashboard-summary` | Real-time KPI metrics & lists | Admin |
| `POST` | `/api/reports/daily-summary/trigger`| Manually trigger owner summary report | Admin |
| `GET` | `/api/addons` | Available add-ons catalog | Authenticated |
| `POST` | `/api/addons/{id}/purchase` | Purchase PT/Diet/Supplement add-on | Authenticated |
| `GET` | `/api/health` | Service health status | Public |

---

## 🚀 Running Locally

### Prerequisites
- Java 17+ (OpenJDK 25 bundled)
- Node.js 18+ (Node v24.17 bundled)
- MongoDB Compass (optional, connect to `mongodb://localhost:27017/gym_manager_db`)

### 1. Backend (Spring Boot)
```powershell
cd backend
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080` (MongoDB wire-server on port `27017`).*

### 2. Frontend (React + Vite)
```powershell
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173` (proxies `/api` to `http://localhost:8080`).*
