const env = require('./env');

const objectId = {
  type: 'string',
  pattern: '^[a-fA-F0-9]{24}$',
  example: '507f1f77bcf86cd799439011',
};

const date = {
  type: 'string',
  format: 'date',
  example: '2026-07-11',
};

const dateTime = {
  type: 'string',
  format: 'date-time',
  example: '2026-07-11T09:30:00.000Z',
};

const idParameter = (name, description) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: objectId,
});

const queryParameter = (name, schema, description, required = false) => ({
  name,
  in: 'query',
  required,
  description,
  schema,
});

const requestBody = (schema, example) => ({
  required: true,
  content: {
    'application/json': {
      schema,
      ...(example ? { example } : {}),
    },
  },
});

const dataResponse = (description, schema, example) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: schema,
        },
      },
      ...(example ? { example } : {}),
    },
  },
});

const messageResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/MessageResponse' },
    },
  },
});

const commonErrors = {
  400: { $ref: '#/components/responses/BadRequest' },
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
  404: { $ref: '#/components/responses/NotFound' },
  500: { $ref: '#/components/responses/ServerError' },
};

const adminSecurity = [{ bearerAuth: [] }];
const employeeSecurity = [{ bearerAuth: [] }];
const authenticatedSecurity = [{ bearerAuth: [] }];

const yearQuery = queryParameter(
  'year',
  { type: 'integer', minimum: 2000, maximum: 2100, example: 2026 },
  'Calendar year. Defaults to the current year.',
);
const monthQuery = queryParameter(
  'month',
  { type: 'integer', minimum: 1, maximum: 12, example: 7 },
  'Calendar month from 1 to 12. Defaults to the current month.',
);
const employeeIdQuery = queryParameter(
  'employeeId',
  objectId,
  'MongoDB employee record ID. Omit to include all employees.',
);
const dateFromQuery = queryParameter('dateFrom', date, 'Range start. Must be used with dateTo.');
const dateToQuery = queryParameter('dateTo', date, 'Range end. Must be used with dateFrom.');

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'HRMS API',
    version: '1.0.0',
    description:
      'Interactive API documentation for the HRMS MERN application. Login first, copy the returned accessToken, then click Authorize and enter the token. Refresh tokens are managed through an HTTP-only cookie.',
    contact: {
      name: 'HRMS Development Team',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Current server (recommended for local and deployed environments)',
    },
    {
      url: `http://localhost:${env.port}/api`,
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'System', description: 'API health and protected dashboard checks' },
    { name: 'Authentication', description: 'Admin/employee sessions and token lifecycle' },
    { name: 'Employees', description: 'Admin-only employee management' },
    { name: 'Employment Types', description: 'Admin-only employment types and leave policies' },
    { name: 'Leave', description: 'Employee leave requests and admin approvals' },
    { name: 'Holidays', description: 'Shared holiday calendar and admin management' },
    { name: 'Attendance', description: 'Employee punch logs and admin reports' },
    { name: 'Payroll', description: 'Admin payroll processing and employee salary slips' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Check API health',
        responses: {
          200: messageResponse('API is running.'),
        },
      },
    },
    '/auth/login/admin': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in as admin',
        description: 'Returns an access token and sets the refresh token as an HTTP-only cookie.',
        requestBody: requestBody(
          { $ref: '#/components/schemas/LoginRequest' },
          { email: 'admin@hrms.com', password: 'Admin@123' },
        ),
        responses: {
          200: dataResponse('Admin login successful.', { $ref: '#/components/schemas/AuthData' }),
          401: commonErrors[401],
          403: commonErrors[403],
          500: commonErrors[500],
        },
      },
    },
    '/auth/login/employee': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in as employee',
        description: 'Returns an access token and sets the refresh token as an HTTP-only cookie.',
        requestBody: requestBody(
          { $ref: '#/components/schemas/LoginRequest' },
          { email: 'employee@hrms.com', password: 'Employee@123' },
        ),
        responses: {
          200: dataResponse('Employee login successful.', { $ref: '#/components/schemas/AuthData' }),
          401: commonErrors[401],
          403: commonErrors[403],
          500: commonErrors[500],
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh the access token',
        description: 'Uses and rotates the HTTP-only refresh-token cookie set during login.',
        security: [{ refreshCookie: [] }],
        responses: {
          200: dataResponse('Access token refreshed.', { $ref: '#/components/schemas/AuthData' }),
          401: commonErrors[401],
          500: commonErrors[500],
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Log out and clear refresh cookie',
        security: [{ refreshCookie: [] }],
        responses: {
          200: messageResponse('Logged out successfully.'),
          500: commonErrors[500],
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        security: authenticatedSecurity,
        responses: {
          200: dataResponse('Current authenticated profile.', { $ref: '#/components/schemas/UserProfile' }),
          ...commonErrors,
        },
      },
    },
    '/employees': {
      get: {
        tags: ['Employees'],
        summary: 'List and search employees (Admin)',
        security: adminSecurity,
        parameters: [
          queryParameter('page', { type: 'integer', minimum: 1, default: 1 }, 'Page number.'),
          queryParameter('limit', { type: 'integer', minimum: 1, maximum: 50, default: 10 }, 'Items per page.'),
          queryParameter('search', { type: 'string' }, 'Search name, email, employee ID, phone, designation, or department.'),
          queryParameter('status', { type: 'string', enum: ['active', 'inactive'] }, 'Employee status.'),
          queryParameter('department', { type: 'string' }, 'Department filter.'),
          queryParameter('designation', { type: 'string' }, 'Designation filter.'),
          queryParameter('employmentType', { type: 'string', example: 'full_time' }, 'Employment type code.'),
        ],
        responses: {
          200: {
            description: 'Paginated employee list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Employee' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          ...commonErrors,
        },
      },
      post: {
        tags: ['Employees'],
        summary: 'Create employee (Admin)',
        description: 'Creates the employee user account and initializes leave balances.',
        security: adminSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/CreateEmployeeRequest' },
          {
            fullName: 'Aarav Sharma',
            email: 'aarav.sharma@example.com',
            password: 'Employee@123',
            phoneNumber: '9876543210',
            designation: 'Software Engineer',
            department: 'Engineering',
            dateOfJoining: '2026-07-01',
            monthlySalary: 50000,
            employmentType: 'full_time',
            reportingManagerId: null,
          },
        ),
        responses: {
          201: dataResponse('Employee created.', { $ref: '#/components/schemas/Employee' }),
          409: { $ref: '#/components/responses/Conflict' },
          ...commonErrors,
        },
      },
    },
    '/employees/managers': {
      get: {
        tags: ['Employees'],
        summary: 'List reporting-manager options (Admin)',
        security: adminSecurity,
        responses: {
          200: dataResponse('Manager options.', { type: 'array', items: { $ref: '#/components/schemas/ManagerOption' } }),
          ...commonErrors,
        },
      },
    },
    '/employees/{id}': {
      get: {
        tags: ['Employees'],
        summary: 'Get one employee (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Employee record ID.')],
        responses: {
          200: dataResponse('Employee details.', { $ref: '#/components/schemas/Employee' }),
          ...commonErrors,
        },
      },
      patch: {
        tags: ['Employees'],
        summary: 'Update employee (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Employee record ID.')],
        requestBody: requestBody({ $ref: '#/components/schemas/UpdateEmployeeRequest' }),
        responses: {
          200: dataResponse('Employee updated.', { $ref: '#/components/schemas/Employee' }),
          409: { $ref: '#/components/responses/Conflict' },
          ...commonErrors,
        },
      },
    },
    '/employees/{id}/status': {
      patch: {
        tags: ['Employees'],
        summary: 'Activate or deactivate employee (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Employee record ID.')],
        requestBody: requestBody(
          {
            type: 'object',
            required: ['status'],
            properties: { status: { type: 'string', enum: ['active', 'inactive'] } },
          },
          { status: 'inactive' },
        ),
        responses: {
          200: dataResponse('Employee status updated.', { $ref: '#/components/schemas/Employee' }),
          ...commonErrors,
        },
      },
    },
    '/employment-types': {
      get: {
        tags: ['Employment Types'],
        summary: 'List employment types and policies (Admin)',
        security: adminSecurity,
        responses: {
          200: dataResponse('Employment types.', { type: 'array', items: { $ref: '#/components/schemas/EmploymentType' } }),
          ...commonErrors,
        },
      },
      post: {
        tags: ['Employment Types'],
        summary: 'Create employment type and leave policy (Admin)',
        security: adminSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/EmploymentTypeRequest' },
          {
            name: 'Seasonal',
            description: 'Seasonal workforce',
            isActive: true,
            leaveRules: [
              { leaveType: 'Paid Leave', annualDays: 6, isUnlimited: false },
              { leaveType: 'Unpaid Leave', annualDays: 0, isUnlimited: true },
            ],
          },
        ),
        responses: {
          201: dataResponse('Employment type created.', { $ref: '#/components/schemas/EmploymentType' }),
          409: { $ref: '#/components/responses/Conflict' },
          ...commonErrors,
        },
      },
    },
    '/employment-types/options': {
      get: {
        tags: ['Employment Types'],
        summary: 'List active employment-type options (Admin)',
        security: adminSecurity,
        responses: {
          200: dataResponse('Employment type options.', { type: 'array', items: { $ref: '#/components/schemas/EmploymentTypeOption' } }),
          ...commonErrors,
        },
      },
    },
    '/employment-types/{id}': {
      get: {
        tags: ['Employment Types'],
        summary: 'Get employment type and policy (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Employment type ID.')],
        responses: {
          200: dataResponse('Employment type details.', { $ref: '#/components/schemas/EmploymentType' }),
          ...commonErrors,
        },
      },
      patch: {
        tags: ['Employment Types'],
        summary: 'Update employment type (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Employment type ID.')],
        requestBody: requestBody({ $ref: '#/components/schemas/UpdateEmploymentTypeRequest' }),
        responses: {
          200: dataResponse('Employment type updated.', { $ref: '#/components/schemas/EmploymentType' }),
          ...commonErrors,
        },
      },
    },
    '/employment-types/{id}/policy': {
      patch: {
        tags: ['Employment Types'],
        summary: 'Replace leave policy rules (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Employment type ID.')],
        requestBody: requestBody(
          {
            type: 'object',
            required: ['leaveRules'],
            properties: {
              leaveRules: { type: 'array', items: { $ref: '#/components/schemas/LeaveRule' } },
            },
          },
          { leaveRules: [{ leaveType: 'Paid Leave', annualDays: 12, isUnlimited: false }] },
        ),
        responses: {
          200: dataResponse('Leave policy updated.', { $ref: '#/components/schemas/EmploymentType' }),
          ...commonErrors,
        },
      },
    },
    '/leaves/my/balances': {
      get: {
        tags: ['Leave'],
        summary: 'Get my leave balances (Employee)',
        security: employeeSecurity,
        parameters: [yearQuery],
        responses: {
          200: dataResponse('Leave balances.', { $ref: '#/components/schemas/LeaveBalance' }),
          ...commonErrors,
        },
      },
    },
    '/leaves/my/requests': {
      get: {
        tags: ['Leave'],
        summary: 'List my leave requests (Employee)',
        security: employeeSecurity,
        responses: {
          200: dataResponse('Leave requests.', { type: 'array', items: { $ref: '#/components/schemas/LeaveRequest' } }),
          ...commonErrors,
        },
      },
    },
    '/leaves/apply': {
      post: {
        tags: ['Leave'],
        summary: 'Apply for leave (Employee)',
        security: employeeSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/ApplyLeaveRequest' },
          {
            leaveType: 'Paid Leave',
            fromDate: '2026-07-20',
            toDate: '2026-07-21',
            isHalfDay: false,
            reason: 'Family function',
          },
        ),
        responses: {
          201: dataResponse('Leave request submitted.', { $ref: '#/components/schemas/LeaveRequest' }),
          ...commonErrors,
        },
      },
    },
    '/leaves/admin/requests': {
      get: {
        tags: ['Leave'],
        summary: 'List all leave requests (Admin)',
        security: adminSecurity,
        parameters: [
          queryParameter('status', { type: 'string', enum: ['pending', 'approved', 'rejected'] }, 'Request status.'),
          employeeIdQuery,
        ],
        responses: {
          200: dataResponse('Leave requests.', { type: 'array', items: { $ref: '#/components/schemas/LeaveRequest' } }),
          ...commonErrors,
        },
      },
    },
    '/leaves/admin/balances/{employeeId}': {
      get: {
        tags: ['Leave'],
        summary: 'Get employee leave balances (Admin)',
        security: adminSecurity,
        parameters: [idParameter('employeeId', 'Employee record ID.'), yearQuery],
        responses: {
          200: dataResponse('Employee leave balances.', { $ref: '#/components/schemas/LeaveBalance' }),
          ...commonErrors,
        },
      },
    },
    '/leaves/{id}/approve': {
      patch: {
        tags: ['Leave'],
        summary: 'Approve leave request (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Leave request ID.')],
        responses: {
          200: dataResponse('Leave request approved.', { $ref: '#/components/schemas/LeaveRequest' }),
          ...commonErrors,
        },
      },
    },
    '/leaves/{id}/reject': {
      patch: {
        tags: ['Leave'],
        summary: 'Reject leave request (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Leave request ID.')],
        requestBody: requestBody(
          {
            type: 'object',
            properties: { rejectionReason: { type: 'string', example: 'Insufficient staffing.' } },
          },
          { rejectionReason: 'Insufficient staffing.' },
        ),
        responses: {
          200: dataResponse('Leave request rejected.', { $ref: '#/components/schemas/LeaveRequest' }),
          ...commonErrors,
        },
      },
    },
    '/holidays': {
      get: {
        tags: ['Holidays'],
        summary: 'List holidays (Admin or Employee)',
        security: authenticatedSecurity,
        parameters: [yearQuery],
        responses: {
          200: dataResponse('Holidays.', { type: 'array', items: { $ref: '#/components/schemas/Holiday' } }),
          ...commonErrors,
        },
      },
      post: {
        tags: ['Holidays'],
        summary: 'Create holiday (Admin)',
        security: adminSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/HolidayRequest' },
          { name: 'Independence Day', date: '2026-08-15', description: 'National holiday' },
        ),
        responses: {
          201: dataResponse('Holiday created.', { $ref: '#/components/schemas/Holiday' }),
          409: { $ref: '#/components/responses/Conflict' },
          ...commonErrors,
        },
      },
    },
    '/holidays/{id}': {
      get: {
        tags: ['Holidays'],
        summary: 'Get holiday (Admin or Employee)',
        security: authenticatedSecurity,
        parameters: [idParameter('id', 'Holiday ID.')],
        responses: {
          200: dataResponse('Holiday details.', { $ref: '#/components/schemas/Holiday' }),
          ...commonErrors,
        },
      },
      patch: {
        tags: ['Holidays'],
        summary: 'Update holiday (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Holiday ID.')],
        requestBody: requestBody({ $ref: '#/components/schemas/UpdateHolidayRequest' }),
        responses: {
          200: dataResponse('Holiday updated.', { $ref: '#/components/schemas/Holiday' }),
          409: { $ref: '#/components/responses/Conflict' },
          ...commonErrors,
        },
      },
      delete: {
        tags: ['Holidays'],
        summary: 'Delete holiday (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Holiday ID.')],
        responses: {
          200: dataResponse('Holiday deleted.', { $ref: '#/components/schemas/DeletedHoliday' }),
          ...commonErrors,
        },
      },
    },
    '/attendance/me/today': {
      get: {
        tags: ['Attendance'],
        summary: "Get today's attendance (Employee)",
        security: employeeSecurity,
        responses: {
          200: dataResponse("Today's attendance.", { $ref: '#/components/schemas/AttendanceDay' }),
          ...commonErrors,
        },
      },
    },
    '/attendance/punch-in': {
      post: {
        tags: ['Attendance'],
        summary: 'Punch in now (Employee)',
        description: 'Uses server time. A custom or past timestamp cannot be supplied.',
        security: employeeSecurity,
        responses: {
          201: dataResponse('Punched in.', { $ref: '#/components/schemas/AttendanceDay' }),
          ...commonErrors,
        },
      },
    },
    '/attendance/punch-out': {
      post: {
        tags: ['Attendance'],
        summary: 'Punch out now (Employee)',
        description: 'Uses server time and closes the current open attendance session.',
        security: employeeSecurity,
        responses: {
          200: dataResponse('Punched out.', { $ref: '#/components/schemas/AttendanceDay' }),
          ...commonErrors,
        },
      },
    },
    '/attendance/me/calendar': {
      get: {
        tags: ['Attendance'],
        summary: 'Get monthly attendance calendar (Employee)',
        security: employeeSecurity,
        parameters: [monthQuery, yearQuery, dateFromQuery, dateToQuery],
        responses: {
          200: dataResponse('Attendance calendar.', { $ref: '#/components/schemas/AttendanceCalendar' }),
          ...commonErrors,
        },
      },
    },
    '/attendance/me/history': {
      get: {
        tags: ['Attendance'],
        summary: 'Get attendance history (Employee)',
        security: employeeSecurity,
        parameters: [monthQuery, yearQuery, dateFromQuery, dateToQuery],
        responses: {
          200: dataResponse('Attendance history.', { type: 'array', items: { $ref: '#/components/schemas/AttendanceDay' } }),
          ...commonErrors,
        },
      },
    },
    '/attendance/me/day': {
      get: {
        tags: ['Attendance'],
        summary: 'Get one attendance day (Employee)',
        security: employeeSecurity,
        parameters: [queryParameter('date', date, 'Selected date.', true)],
        responses: {
          200: dataResponse('Attendance day.', { $ref: '#/components/schemas/AttendanceDay' }),
          ...commonErrors,
        },
      },
    },
    '/attendance/admin/records': {
      get: {
        tags: ['Attendance'],
        summary: 'Get detailed attendance records (Admin)',
        security: adminSecurity,
        parameters: [employeeIdQuery, monthQuery, yearQuery, dateFromQuery, dateToQuery],
        responses: {
          200: dataResponse('Attendance records.', { $ref: '#/components/schemas/AdminAttendanceRecords' }),
          ...commonErrors,
        },
      },
    },
    '/attendance/admin/report': {
      get: {
        tags: ['Attendance'],
        summary: 'Get summarized attendance report (Admin)',
        security: adminSecurity,
        parameters: [employeeIdQuery, monthQuery, yearQuery, dateFromQuery, dateToQuery],
        responses: {
          200: dataResponse('Attendance report.', { $ref: '#/components/schemas/AttendanceReport' }),
          ...commonErrors,
        },
      },
    },
    '/payroll/run': {
      post: {
        tags: ['Payroll'],
        summary: 'Process payroll (Admin)',
        description: 'Processes all eligible employees, or one employee when employeeId is supplied. Re-running updates existing records for the month.',
        security: adminSecurity,
        requestBody: requestBody(
          { $ref: '#/components/schemas/RunPayrollRequest' },
          { month: 7, year: 2026, employeeId: '507f1f77bcf86cd799439011' },
        ),
        responses: {
          201: dataResponse('Payroll processed.', { type: 'array', items: { $ref: '#/components/schemas/Payroll' } }),
          ...commonErrors,
        },
      },
    },
    '/payroll/admin': {
      get: {
        tags: ['Payroll'],
        summary: 'List payroll records (Admin)',
        security: adminSecurity,
        parameters: [monthQuery, yearQuery, employeeIdQuery],
        responses: {
          200: dataResponse('Payroll records.', { type: 'array', items: { $ref: '#/components/schemas/Payroll' } }),
          ...commonErrors,
        },
      },
    },
    '/payroll/admin/{id}': {
      get: {
        tags: ['Payroll'],
        summary: 'Get payroll record (Admin)',
        security: adminSecurity,
        parameters: [idParameter('id', 'Payroll record ID.')],
        responses: {
          200: dataResponse('Payroll details.', { $ref: '#/components/schemas/Payroll' }),
          ...commonErrors,
        },
      },
    },
    '/payroll/me': {
      get: {
        tags: ['Payroll'],
        summary: 'List my payroll records (Employee)',
        security: employeeSecurity,
        responses: {
          200: dataResponse('Employee payroll records.', { type: 'array', items: { $ref: '#/components/schemas/Payroll' } }),
          ...commonErrors,
        },
      },
    },
    '/payroll/{id}/slip': {
      get: {
        tags: ['Payroll'],
        summary: 'Download salary slip PDF (Admin or record owner)',
        security: authenticatedSecurity,
        parameters: [idParameter('id', 'Payroll record ID.')],
        responses: {
          200: {
            description: 'Generated salary slip PDF.',
            headers: {
              'Content-Disposition': {
                description: 'Download filename.',
                schema: { type: 'string', example: 'attachment; filename="salary-slip-EMP0001-2026-07.pdf"' },
              },
            },
            content: {
              'application/pdf': { schema: { type: 'string', format: 'binary' } },
            },
          },
          ...commonErrors,
        },
      },
    },
    '/admin/dashboard': {
      get: {
        tags: ['System'],
        summary: 'Check admin dashboard access (Admin)',
        security: adminSecurity,
        responses: {
          200: dataResponse('Admin dashboard data.', { type: 'object', additionalProperties: true }),
          ...commonErrors,
        },
      },
    },
    '/employee/dashboard': {
      get: {
        tags: ['System'],
        summary: 'Check employee dashboard access (Employee)',
        security: employeeSecurity,
        responses: {
          200: dataResponse('Employee dashboard data.', { type: 'object', additionalProperties: true }),
          ...commonErrors,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste only the accessToken returned by a login endpoint.',
      },
      refreshCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: env.cookieName,
        description: 'HTTP-only refresh cookie automatically set and sent by the browser.',
      },
    },
    responses: {
      BadRequest: { description: 'Invalid request.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      Unauthorized: { description: 'Authentication is missing, invalid, or expired.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      Forbidden: { description: 'The authenticated role cannot perform this operation.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      NotFound: { description: 'Requested record was not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      Conflict: { description: 'A record with the same unique value already exists.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      ServerError: { description: 'Unexpected server error.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed.' },
        },
      },
      MessageResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully.' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password', minLength: 1 },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: objectId,
          fullName: { type: 'string', example: 'Aarav Sharma' },
          email: { type: 'string', format: 'email', example: 'aarav.sharma@example.com' },
          role: { type: 'string', enum: ['admin', 'employee'] },
          isActive: { type: 'boolean' },
          employee: { allOf: [{ $ref: '#/components/schemas/Employee' }], nullable: true },
        },
      },
      AuthData: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'Short-lived JWT access token.' },
          user: { $ref: '#/components/schemas/UserProfile' },
        },
      },
      ManagerOption: {
        type: 'object',
        properties: {
          id: objectId,
          employeeId: { type: 'string', example: 'EMP0001' },
          fullName: { type: 'string', example: 'Priya Patel' },
          designation: { type: 'string', example: 'Engineering Manager' },
          department: { type: 'string', example: 'Engineering' },
        },
      },
      Employee: {
        type: 'object',
        properties: {
          id: objectId,
          employeeId: { type: 'string', example: 'EMP0009' },
          fullName: { type: 'string', example: 'Aarav Sharma' },
          email: { type: 'string', format: 'email' },
          phoneNumber: { type: 'string', example: '9876543210' },
          designation: { type: 'string', example: 'Software Engineer' },
          department: { type: 'string', example: 'Engineering' },
          dateOfJoining: dateTime,
          monthlySalary: { type: 'number', format: 'double', example: 50000 },
          employmentType: { type: 'string', example: 'full_time' },
          employmentTypeLabel: { type: 'string', example: 'Full Time' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          reportingManager: { allOf: [{ $ref: '#/components/schemas/ManagerOption' }], nullable: true },
          inheritedLeavePolicy: { type: 'object', nullable: true, additionalProperties: true },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      CreateEmployeeRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password', 'phoneNumber', 'designation', 'department', 'dateOfJoining', 'monthlySalary', 'employmentType'],
        properties: {
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          phoneNumber: { type: 'string' },
          designation: { type: 'string' },
          department: { type: 'string' },
          dateOfJoining: date,
          monthlySalary: { type: 'number', minimum: 0 },
          employmentType: { type: 'string', description: 'Active employment type code with a configured leave policy.' },
          reportingManagerId: { ...objectId, nullable: true },
        },
      },
      UpdateEmployeeRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phoneNumber: { type: 'string' },
          designation: { type: 'string' },
          department: { type: 'string' },
          dateOfJoining: date,
          monthlySalary: { type: 'number', minimum: 0 },
          employmentType: { type: 'string' },
          reportingManagerId: { ...objectId, nullable: true },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 25 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
      LeaveRule: {
        type: 'object',
        required: ['leaveType'],
        properties: {
          leaveType: { type: 'string', example: 'Paid Leave' },
          annualDays: { type: 'number', minimum: 0, example: 12 },
          isUnlimited: { type: 'boolean', default: false },
        },
      },
      LeavePolicy: {
        type: 'object',
        properties: {
          id: { ...objectId, nullable: true },
          rules: { type: 'array', items: { $ref: '#/components/schemas/LeaveRule' } },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      EmploymentType: {
        type: 'object',
        properties: {
          id: objectId,
          name: { type: 'string', example: 'Full Time' },
          code: { type: 'string', example: 'full_time' },
          description: { type: 'string' },
          isActive: { type: 'boolean' },
          leavePolicy: { $ref: '#/components/schemas/LeavePolicy' },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      EmploymentTypeOption: {
        type: 'object',
        properties: {
          id: objectId,
          name: { type: 'string', example: 'Full Time' },
          code: { type: 'string', example: 'full_time' },
          hasLeavePolicy: { type: 'boolean' },
        },
      },
      EmploymentTypeRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          isActive: { type: 'boolean', default: true },
          leaveRules: { type: 'array', items: { $ref: '#/components/schemas/LeaveRule' } },
        },
      },
      UpdateEmploymentTypeRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      LeaveBalanceItem: {
        type: 'object',
        properties: {
          leaveType: { type: 'string' },
          allocated: { type: 'number' },
          used: { type: 'number' },
          remaining: { type: 'number' },
          isUnlimited: { type: 'boolean' },
        },
      },
      LeaveBalance: {
        type: 'object',
        properties: {
          id: objectId,
          employeeId: objectId,
          year: { type: 'integer', example: 2026 },
          balances: { type: 'array', items: { $ref: '#/components/schemas/LeaveBalanceItem' } },
        },
      },
      ApplyLeaveRequest: {
        type: 'object',
        required: ['leaveType', 'fromDate', 'toDate', 'reason'],
        properties: {
          leaveType: { type: 'string' },
          fromDate: date,
          toDate: date,
          isHalfDay: { type: 'boolean', default: false },
          halfDaySession: { type: 'string', enum: ['first_half', 'second_half'], nullable: true },
          reason: { type: 'string' },
        },
      },
      LeaveRequest: {
        type: 'object',
        properties: {
          id: objectId,
          employee: { type: 'object', additionalProperties: true },
          leaveType: { type: 'string' },
          fromDate: dateTime,
          toDate: dateTime,
          isHalfDay: { type: 'boolean' },
          halfDaySession: { type: 'string', nullable: true },
          totalDays: { type: 'number', minimum: 0.5 },
          reason: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          rejectionReason: { type: 'string' },
          createdAt: dateTime,
          reviewedAt: { ...dateTime, nullable: true },
        },
      },
      HolidayRequest: {
        type: 'object',
        required: ['name', 'date'],
        properties: {
          name: { type: 'string' },
          date,
          description: { type: 'string' },
        },
      },
      UpdateHolidayRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          date,
          description: { type: 'string' },
        },
      },
      Holiday: {
        type: 'object',
        properties: {
          id: objectId,
          name: { type: 'string' },
          date: dateTime,
          description: { type: 'string' },
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      DeletedHoliday: {
        type: 'object',
        properties: { id: objectId, name: { type: 'string' } },
      },
      AttendanceLog: {
        type: 'object',
        properties: {
          id: objectId,
          action: { type: 'string', enum: ['in', 'out'] },
          timestamp: dateTime,
        },
      },
      AttendanceDay: {
        type: 'object',
        properties: {
          date: dateTime,
          status: { type: 'string', example: 'present' },
          isScheduledWorkday: { type: 'boolean' },
          firstPunchIn: { ...dateTime, nullable: true },
          lastPunchOut: { ...dateTime, nullable: true },
          totalWorkMinutes: { type: 'number', example: 480 },
          totalBreakMinutes: { type: 'number', example: 30 },
          lateMark: { type: 'boolean' },
          logs: { type: 'array', items: { $ref: '#/components/schemas/AttendanceLog' } },
          holiday: { type: 'object', nullable: true, additionalProperties: true },
          leave: { type: 'object', nullable: true, additionalProperties: true },
          employee: { type: 'object', nullable: true, additionalProperties: true },
        },
        additionalProperties: true,
      },
      AttendanceCalendar: {
        type: 'object',
        properties: {
          month: { type: 'integer' },
          year: { type: 'integer' },
          rangeStart: dateTime,
          rangeEnd: dateTime,
          days: { type: 'array', items: { $ref: '#/components/schemas/AttendanceDay' } },
        },
      },
      AdminAttendanceRecords: {
        type: 'object',
        properties: {
          month: { type: 'integer' },
          year: { type: 'integer' },
          rangeStart: dateTime,
          rangeEnd: dateTime,
          records: { type: 'array', items: { $ref: '#/components/schemas/AttendanceDay' } },
        },
      },
      AttendanceReport: {
        type: 'object',
        properties: {
          month: { type: 'integer' },
          year: { type: 'integer' },
          rangeStart: dateTime,
          rangeEnd: dateTime,
          summary: { type: 'object', additionalProperties: { type: 'number' } },
          employees: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
      RunPayrollRequest: {
        type: 'object',
        required: ['month', 'year'],
        properties: {
          month: { type: 'integer', minimum: 1, maximum: 12 },
          year: { type: 'integer', minimum: 2000, maximum: 2100 },
          employeeId: { ...objectId, nullable: true, description: 'Omit to process all eligible employees.' },
        },
      },
      Payroll: {
        type: 'object',
        properties: {
          id: objectId,
          employee: { $ref: '#/components/schemas/Employee' },
          month: { type: 'integer' },
          year: { type: 'integer' },
          payrollMonth: { type: 'string', example: 'July 2026' },
          periodStart: dateTime,
          periodEnd: dateTime,
          companyName: { type: 'string', example: 'HRMS Pvt Ltd' },
          grossSalary: { type: 'number', example: 50000 },
          perDaySalary: { type: 'number', example: 2272.73 },
          totalDeduction: { type: 'number', example: 2272.73 },
          netSalary: { type: 'number', example: 47727.27 },
          slipNumber: { type: 'string', example: 'PAY-EMP0009-202607' },
          attendanceSummary: { type: 'object', additionalProperties: { type: 'number' } },
          deductionBreakdown: { type: 'object', additionalProperties: { type: 'number' } },
          paidLeaveAdjustments: { type: 'array', items: { type: 'object', properties: { leaveType: { type: 'string' }, days: { type: 'number' } } } },
          paidLeaveUsed: { type: 'number' },
          processedAt: dateTime,
        },
        additionalProperties: true,
      },
    },
  },
};

module.exports = swaggerDocument;
