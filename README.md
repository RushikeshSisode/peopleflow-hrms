# HRMS - Human Resource Management System

A full-stack Human Resource Management System built with the MERN stack. The application provides separate Admin and Employee workspaces for managing employees, employment types, leave policies, attendance, holidays, payroll, and downloadable salary slips.

This project was developed as a production-oriented MERN interview assignment with a focus on authentication, role-based access control, business-rule implementation, database design, and maintainable frontend/backend architecture.

## Features

### Admin

- Secure admin login and role-protected routes
- Create, view, search, filter, update, activate, and deactivate employees
- Auto-generate employee IDs and assign reporting managers
- Create employment types and configure their leave policies
- Review employee leave balances and approve or reject leave requests
- Create, update, list, and delete annual holidays
- Review attendance by employee, month, or custom date range
- View attendance summaries including present, absent, leave, and late-mark totals
- Process monthly payroll for one employee or all eligible employees
- View payroll history and download generated salary slips as PDF

### Employee

- Secure employee login with automatic session refresh
- View a personalized HRMS dashboard
- Punch in and punch out multiple times per day
- View working hours, break duration, attendance history, and monthly calendar
- Apply for full-day, half-day, or multi-day leave
- View leave balances and request status
- View holidays in a calendar
- View payroll history and download salary slips

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

- Node.js 20.19 or later
- npm
- MongoDB Atlas cluster or a local MongoDB instance
- A modern web browser

For MongoDB Atlas, create a database user and allow your current IP address through **Network Access**. Your deployed backend's outbound IP must also be allowed.

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
- Default leave policies for those employment types
- Republic Day, Independence Day, Diwali, and Christmas holidays for 2026

With the example environment values, the logins are:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@hrms.com` | `Admin@123` |
| Employee | `employee@hrms.com` | `Employee@123` |

These credentials are only for local demonstration. Change all seeded passwords and JWT secrets before deploying publicly.

## Application URLs

| Resource | Local URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000/api` |
| Health check | `http://localhost:5000/api/health` |
| Swagger UI | `http://localhost:5000/api-docs` |
| OpenAPI JSON | `http://localhost:5000/api-docs.json` |

## API Documentation

Swagger UI documents all authentication, employee, employment-type, leave, holiday, attendance, payroll, and salary-slip endpoints.

To test a protected API:

1. Open `http://localhost:5000/api-docs`.
2. Run `POST /auth/login/admin` or `POST /auth/login/employee`.
3. Copy `data.accessToken` from the response.
4. Click **Authorize** at the top of Swagger UI.
5. Paste only the access token and authorize.
6. Execute endpoints permitted for that role.

The browser automatically manages the HTTP-only refresh cookie when Swagger is opened from the backend URL. The raw specification at `/api-docs.json` can also be imported into Postman or other OpenAPI-compatible tools.

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

## Important Business Rules

### Attendance

- Punch timestamps come from the backend server; employees cannot submit custom past timestamps.
- Multiple punch-in/punch-out sessions are supported each day.
- Working time is calculated from completed in/out pairs.
- Break time is calculated between a punch-out and the next punch-in.
- Saturdays and Sundays are treated as weekends.
- The office start time is `09:30 AM`; a later first punch-in creates one late mark.

### Leave

- Leave balances are inherited from the employee's employment-type policy.
- Approved requests update the relevant leave balance.
- Full-day, half-day, and multi-day requests are supported.
- Requests follow `pending`, `approved`, or `rejected` status.

### Payroll

- Per-day salary is `monthly salary / working days` for the selected payroll period.
- Every three late marks produce a `0.5` day deduction.
- Unpaid leave is deducted directly.
- Available paid-leave balance is automatically used against absence and late-deduction days before salary deduction.
- Re-running payroll for the same employee, month, and year updates the existing payroll record.
- Salary slips are generated as PDFs with company, employee, payroll, earnings, deductions, and net-pay details.

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

The production deployment uses one Render Web Service. Express serves both the API and the compiled React application, which keeps authentication cookies and `/api` requests on the same origin.

The included `render.yaml` configures Render's free web-service plan, build, start command, health check, Node.js version, and non-secret environment defaults.

### Render

1. Push the complete repository to GitHub.
2. In Render, create a new Blueprint and select the repository.
3. Provide the environment variables marked `sync: false` in `render.yaml`.
4. Set `CLIENT_URL` to the final Render service URL.
5. Set `MONGO_URI` to the MongoDB Atlas connection string.
6. Set private `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` values.
7. Keep `SEED_DEMO_DATA=false` in production.
8. Add the service's Render outbound IP ranges to the Atlas IP access list.
9. Deploy and verify `/api/health` before testing the application.

Render runs this build command from the repository root:

```bash
npm ci --prefix server && npm ci --prefix client --include=dev && npm run build --prefix client
```

It starts the combined application with:

```bash
npm start --prefix server
```

Never commit `.env`, MongoDB credentials, JWT secrets, or production passwords.

### Submission Links

After deployment, share:

- GitHub repository URL
- Frontend application URL
- Backend health-check URL
- Deployed Swagger UI URL: `https://your-backend-domain/api-docs`

Do not share localhost links in the final submission because they only work on the development computer.

## Current Scope

The project covers the HRMS assignment's required authentication, employee management, employment types and leave policies, leave management, holidays, attendance, payroll, PDF salary slips, and Swagger documentation. Automated tests and email notifications are outside the current implementation.

## License

This project was created for an interview assignment and educational evaluation.
