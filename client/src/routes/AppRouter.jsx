import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/common/ProtectedRoute'
import PublicOnlyRoute from '../components/common/PublicOnlyRoute'
import AuthLayout from '../components/layout/AuthLayout'
import DashboardLayout from '../components/layout/DashboardLayout'
import AdminAttendancePage from '../pages/AdminAttendancePage'
import AdminPayrollPage from '../pages/AdminPayrollPage'
import DashboardPage from '../pages/DashboardPage'
import EmployeeAttendancePage from '../pages/EmployeeAttendancePage'
import EmployeeDetailPage from '../pages/EmployeeDetailPage'
import EmployeeFormPage from '../pages/EmployeeFormPage'
import EmployeeHolidayPage from '../pages/EmployeeHolidayPage'
import EmployeeListPage from '../pages/EmployeeListPage'
import EmployeeLeavePage from '../pages/EmployeeLeavePage'
import EmployeePayrollPage from '../pages/EmployeePayrollPage'
import AdminLeaveReviewPage from '../pages/AdminLeaveReviewPage'
import AdminHolidayListPage from '../pages/AdminHolidayListPage'
import EmploymentTypeDetailPage from '../pages/EmploymentTypeDetailPage'
import EmploymentTypeFormPage from '../pages/EmploymentTypeFormPage'
import EmploymentTypeListPage from '../pages/EmploymentTypeListPage'
import HolidayFormPage from '../pages/HolidayFormPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'

function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route index element={<Navigate replace to="/login/admin" />} />
          <Route path="/login/admin" element={<LoginPage role="admin" />} />
          <Route path="/login/employee" element={<LoginPage role="employee" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/employees" element={<EmployeeListPage />} />
          <Route
            path="/admin/employees/new"
            element={<EmployeeFormPage mode="create" />}
          />
          <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
          <Route
            path="/admin/employees/:id/edit"
            element={<EmployeeFormPage mode="edit" />}
          />
          <Route
            path="/admin/employment-types"
            element={<EmploymentTypeListPage />}
          />
          <Route
            path="/admin/employment-types/new"
            element={<EmploymentTypeFormPage mode="create" />}
          />
          <Route
            path="/admin/employment-types/:id"
            element={<EmploymentTypeDetailPage />}
          />
          <Route
            path="/admin/employment-types/:id/edit"
            element={<EmploymentTypeFormPage mode="edit" />}
          />
          <Route path="/admin/holidays" element={<AdminHolidayListPage />} />
          <Route path="/admin/attendance" element={<AdminAttendancePage />} />
          <Route path="/admin/payroll" element={<AdminPayrollPage />} />
          <Route
            path="/admin/holidays/new"
            element={<HolidayFormPage mode="create" />}
          />
          <Route
            path="/admin/holidays/:id/edit"
            element={<HolidayFormPage mode="edit" />}
          />
          <Route path="/admin/leaves" element={<AdminLeaveReviewPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/employee/dashboard" element={<DashboardPage />} />
          <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
          <Route path="/employee/holidays" element={<EmployeeHolidayPage />} />
          <Route path="/employee/leaves" element={<EmployeeLeavePage />} />
          <Route path="/employee/payroll" element={<EmployeePayrollPage />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
