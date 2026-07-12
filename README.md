# HRMS - Human Resource Management System

A full-stack Human Resource Management System built with the MERN stack. The application provides separate Admin and Employee workspaces for managing employees, employment types, leave policies, attendance, holidays, payroll, and downloadable salary slips.



## Features

### Admin

- Secure admin login and role-protected routes
- Create, view, search, filter, update, activate, deactivate, and delete employees
- Auto-generate employee IDs and assign reporting managers
- Create employment types and configure their leave policies using fixed leave buckets
- Review employee leave balances and approve or reject leave requests
- Create, update, list, and delete annual holidays
- Review attendance by employee, month, or custom date range
- View attendance summaries including present, absent, leave, and late-mark totals
- Process monthly payroll for one employee or all eligible employees
- View payroll history and download generated salary slips as PDF

### Employee

- Secure employee login with automatic session refresh
- View a personalized HRMS dashboard with leave, attendance, and holiday widgets
- Punch in and punch out multiple times per day
- View working hours, break duration, attendance history, and a monthly attendance calendar
- Apply for full-day, half-day, or multi-day leave
- View leave balances and request status
- View holidays in a calendar, including a dashboard holiday calendar
- View payroll history, open salary slips in the browser, and download salary slips

### Security

- Password hashing with bcrypt
- Short-lived JWT access tokens
- Rotating refresh tokens stored in HTTP-only cookies
- Admin and Employee role-based authorization
- Protected frontend and backend routes
- Centralized API error handling

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite, Redux Toolkit, React Router, Tailwind CSS, Axios |
| Backend | Node.js, Express 5, MVC/service architecture |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcrypt, HTTP-only cookies, role-based authorization |
| API Documentation | OpenAPI 3.0, Swagger UI |
| PDF Generation | Custom server-side salary-slip PDF generator |

## Architecture

```text
React + Redux Toolkit
        |
        | Axios (/api) + JWT access token
        v
Express routes -> Authentication/RBAC middleware -> Controllers
                                                     |
                                                     v
                                                  Services
                                                     |
                                                     v
                                            Mongoose models -> MongoDB
```

The frontend keeps the access token in Redux and sends it through the `Authorization` header. The refresh token is never exposed to JavaScript; it is stored in an HTTP-only cookie and used to restore or refresh the session.

The backend separates routes, middleware, controllers, services, models, configuration, and utilities. Controllers handle HTTP input/output while services contain validation and HRMS business logic.

## Project Structure

```text
HRMS/
|-- client/
|   |-- src/
|   |   |-- api/                 # Axios client
|   |   |-- app/                 # Redux store and API interceptors
|   |   |-- components/          # Shared calendars, forms, layouts, route guards
|   |   |-- features/            # Redux slices and API services by module
|   |   |-- hooks/               # Reusable React hooks
|   |   |-- pages/               # Admin, employee, and authentication pages
|   |   |-- routes/              # React Router configuration
|   |   `-- utils/               # Calendar, attendance, and payroll helpers
|   |-- package.json
|   `-- vite.config.js
|-- server/
|   |-- src/
|   |   |-- config/              # Environment, database, and Swagger config
|   |   |-- constants/           # Shared constants such as roles
|   |   |-- controllers/         # HTTP request/response handlers
|   |   |-- middlewares/         # Authentication, authorization, errors
|   |   |-- models/              # Mongoose schemas
|   |   |-- routes/              # Express API routes
|   |   |-- services/            # Validation and business logic
|   |   `-- utils/               # JWT, password, ID, error, and PDF helpers
|   |-- .env.example
|   `-- package.json
|-- ProjectDetails.txt
`-- README.md
```

## Prerequisites

Install or create the following before running the project:

- Node.js 22.22.0 or later
- npm
- MongoDB Atlas cluster or a local MongoDB instance
- A modern web browser

For MongoDB Atlas, create a database user and allow your current IP address through **Network Access**. Your deployed backend's outbound IP ranges must also be allowed.

## Local Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd HRMS
```

### 2. Configure and start the backend

```bash
cd server
npm install
```

Create `server/.env` from `server/.env.example`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Configure the values in `.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=your-mongodb-connection-string
JWT_ACCESS_SECRET=use-a-long-random-access-secret
JWT_REFRESH_SECRET=use-a-different-long-random-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
REFRESH_COOKIE_NAME=hrms_refresh_token
SEED_ADMIN_EMAIL=admin@hrms.com
SEED_ADMIN_PASSWORD=Admin@123
SEED_EMPLOYEE_EMAIL=employee@hrms.com
SEED_EMPLOYEE_PASSWORD=Employee@123
SEED_DEMO_DATA=true
```

Start the backend:

```bash
npm run dev
```

The backend runs at `http://localhost:5000`.

### 3. Install and start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and Vite proxies `/api` requests to the backend on port `5000`.

## Seeded Development Data

On backend startup, the application creates or updates:

- Admin and employee demo accounts from the environment variables
- A demo employee profile
- Full Time, Intern, and Contractual employment types
- Default leave policies for those employment types using four fixed leave buckets:
  Full Time = Casual 12, Sick 12, Paid 18, Unpaid 0
  Intern = Casual 4, Sick 6, Paid 0, Unpaid 0
  Contractual = Casual 2, Sick 4, Paid 6, Unpaid 0
- Republic Day, Independence Day, Diwali, and Christmas holidays for 2026

With the example environment values, the logins are:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@hrms.com` | `Admin@123` |
| Employee | `employee@hrms.com` | `Employee@123` |

These credentials are only for local demonstration. 

## Application URLs

| Resource | Local URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000/api` |
| Health check | `http://localhost:5000/api/health` |
| Swagger UI | `http://localhost:5000/api-docs` |
| OpenAPI JSON | `http://localhost:5000/api-docs.json` |

## Swagger API Documentation

Swagger UI documents all authentication, employee, employment-type, leave, holiday, attendance, payroll, and salary-slip endpoints.

To test a protected API:

1. Open `http://localhost:5000/api-docs`.
2. Run `POST /auth/login/admin` or `POST /auth/login/employee`.
3. Copy `data.accessToken` from the response.
4. Click **Authorize** at the top of Swagger UI.
5. Paste only the access token and authorize.
6. Execute endpoints permitted for that role.



## Main API Groups

| Prefix | Purpose | Access |
| --- | --- | --- |
| `/api/auth` | Login, refresh, logout, current session | Public/authenticated |
| `/api/employees` | Employee management and reporting managers | Admin |
| `/api/employment-types` | Employment types and leave policies | Admin |
| `/api/leaves` | Leave balances, requests, approvals, rejections | Admin/Employee |
| `/api/holidays` | Holiday calendar and management | Admin/Employee |
| `/api/attendance` | Punching, calendar, history, and reports | Admin/Employee |
| `/api/payroll` | Payroll processing, history, and salary slips | Admin/Employee |

Refer to Swagger UI for complete request bodies, parameters, examples, responses, and authorization requirements.

## Important Project Rules

### Attendance

- Punch timestamps come from the backend server; employees cannot submit custom past timestamps.
- Multiple punch-in/punch-out sessions are supported each day.
- Working time is calculated from completed in/out pairs.
- Break time is calculated between a punch-out and the next punch-in.
- Saturdays and Sundays are treated as weekends.
- The office start time is `09:30 AM`; a later first punch-in creates one late mark.

### Leave

- Leave balances are inherited from the employee's employment-type policy.
- Every employment type uses the same four leave buckets: `Casual Leave`, `Sick Leave`, `Paid Leave`, and `Unpaid Leave`.
- Admins only configure annual day counts for those four buckets.
- Approved requests update the relevant leave balance.
- Full-day, half-day, and multi-day requests are supported.
- Requests follow `pending`, `approved`, or `rejected` status.
- Employees can currently apply for leave for past, current, or future dates, as long as the request stays within one calendar year and does not overlap another pending or approved request.

### Payroll

- Per-day salary is `monthly salary / working days` for the selected payroll period.
- Every three late marks produce a `0.5` day deduction.
- Salary deduction comes from unpaid leave, absent days, late-mark conversion, and unpaid half-days.
- Approved paid half-days consume `0.5` leave without salary deduction.
- Available `Paid Leave` balance is automatically used against absence and late-deduction days before salary deduction.
- Re-running payroll for the same employee, month, and year updates the existing payroll record.
- Salary slips are generated as PDFs with company name, employee details, payroll month, gross salary, deductions, and net salary.

## Database Collections

- `users`
- `employees`
- `employmenttypes`
- `leavepolicies`
- `leavebalances`
- `leaverequests`
- `attendancelogs`
- `holidays`
- `payrolls`

Salary slips are generated from payroll records and are not stored in a separate database collection.

## Verification Commands

Frontend lint and production build:

```bash
cd client
npm run lint
npm run build
```

Backend startup check:

```bash
cd server
npm start
```

After startup, verify the health endpoint and Swagger UI in the browser. An automated backend test suite is not currently configured.

## Deployment Notes





## 📌 Submission Links

### 🌐 Live Application
- **URL:** https://peopleflow-hrms.onrender.com/login/admin

### 📖 API Documentation
- **Swagger UI:** https://peopleflow-hrms.onrender.com/api-docs
- **OpenAPI JSON:** https://peopleflow-hrms.onrender.com/api-docs.json

### 👤 Admin Login Credentials

| Field | Value |
|--------|-------|
| Username | `admin89@gmail.com` |
| Password | `admin891234` |



## Current Scope

The project covers the HRMS assignment's required authentication, employee management, employment types and leave policies, leave management, holidays, attendance, payroll, PDF salary slips, deployment, and Swagger documentation.

Current implementation notes:

- Employee delete removes the employee profile, linked user account, attendance logs, leave balances, leave requests, payroll records, and clears any subordinate reporting-manager references.
- The employee dashboard includes both the monthly attendance calendar and the holiday calendar in addition to the dedicated `/employee/attendance` and `/employee/holidays` pages.
- Payroll currently uses only the `Paid Leave` bucket for automatic absence and late-mark adjustment.

Automated backend tests and email notifications are outside the current implementation.


