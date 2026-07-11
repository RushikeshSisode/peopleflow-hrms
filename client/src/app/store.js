import { configureStore } from '@reduxjs/toolkit'
import attendanceReducer from '../features/attendance/attendanceSlice'
import authReducer from '../features/auth/authSlice'
import employeeReducer from '../features/employees/employeeSlice'
import employmentTypeReducer from '../features/employmentTypes/employmentTypeSlice'
import holidayReducer from '../features/holidays/holidaySlice'
import leaveReducer from '../features/leaves/leaveSlice'
import payrollReducer from '../features/payroll/payrollSlice'

export const store = configureStore({
  reducer: {
    attendance: attendanceReducer,
    auth: authReducer,
    employees: employeeReducer,
    employmentTypes: employmentTypeReducer,
    holidays: holidayReducer,
    leaves: leaveReducer,
    payroll: payrollReducer,
  },
})
