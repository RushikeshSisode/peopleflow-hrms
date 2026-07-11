import { NavLink, Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logoutSession } from '../../features/auth/authSlice'
import { useAuth } from '../../hooks/useAuth'

const iconPaths = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5M9 21v-7h6v7" />
    </>
  ),
  employees: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  types: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  attendance: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2M8 2v3M16 2v3" />
    </>
  ),
  payroll: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M8 15h2" />
    </>
  ),
  holidays: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
    </>
  ),
  leave: (
    <>
      <path d="M20.8 4.6c-5.5-.8-10.2 1-12.4 5.1-1.2 2.3-1.2 5-.3 7.3" />
      <path d="M3 21c3.3-5.9 7.8-9.5 13.5-11.2M8.1 17c2.5 1.8 6 1.6 8.5-.4 3.5-2.7 4.2-7.5 4.2-12" />
    </>
  ),
}

function NavIcon({ name }) {
  return (
    <svg
      aria-hidden="true"
      className="hrms-nav-icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'HR'
}

function DashboardLayout() {
  const dispatch = useDispatch()
  const { user } = useAuth()

  const navItems =
    user?.role === 'admin'
      ? [
          { to: '/admin/dashboard', label: 'Home', icon: 'home' },
          { to: '/admin/employees', label: 'Employees', icon: 'employees' },
          { to: '/admin/employment-types', label: 'Employment Types', icon: 'types' },
          { to: '/admin/attendance', label: 'Attendance', icon: 'attendance' },
          { to: '/admin/payroll', label: 'Payroll', icon: 'payroll' },
          { to: '/admin/holidays', label: 'Holidays', icon: 'holidays' },
          { to: '/admin/leaves', label: 'Leave Review', icon: 'leave' },
        ]
      : [
          { to: '/employee/dashboard', label: 'Home', icon: 'home' },
          { to: '/employee/attendance', label: 'Attendance', icon: 'attendance' },
          { to: '/employee/holidays', label: 'Holidays', icon: 'holidays' },
          { to: '/employee/leaves', label: 'My Leaves', icon: 'leave' },
          { to: '/employee/payroll', label: 'My Payroll', icon: 'payroll' },
        ]

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="hrms-app-shell">
      <header className="hrms-topbar">
        <div className="hrms-topbar-inner">
          <NavLink
            aria-label="Go to dashboard"
            className="hrms-brand"
            to={user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'}
          >
            <span className="hrms-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="hrms-brand-name">PeopleFlow</span>
            <span className="hrms-brand-product">HRMS</span>
          </NavLink>

          <div className="hrms-topbar-actions">
            <span className="hrms-today">{todayLabel}</span>
            <span className="hrms-role-badge">
              {user?.role === 'admin' ? 'Admin workspace' : 'Employee self service'}
            </span>
            <div className="hrms-user-summary">
              <span className="hrms-avatar">{getInitials(user?.fullName)}</span>
              <span className="hrms-user-copy">
                <strong>{user?.fullName}</strong>
                <small>{user?.email}</small>
              </span>
            </div>
            <button
              type="button"
              onClick={() => dispatch(logoutSession())}
              className="hrms-logout-button"
              title="Sign out"
            >
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4m6-4 4-4m0 0-4-4m4 4H9" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="hrms-navigation" aria-label="Main navigation">
        <div className="hrms-navigation-inner">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `hrms-nav-link${isActive ? ' hrms-nav-link-active' : ''}`
              }
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="hrms-workspace">
        <div className="hrms-content-container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
