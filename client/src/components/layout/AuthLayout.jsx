import { NavLink, Outlet } from 'react-router-dom'

function AuthLayout() {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <div className="auth-header-inner">
          <div className="hrms-brand auth-brand">
            <span className="hrms-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="hrms-brand-name">PeopleFlow</span>
            <span className="hrms-brand-product">HRMS</span>
          </div>
          <span className="auth-header-note">Human resources, simply managed</span>
        </div>
      </header>

      <main className="auth-main">
        <section className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-mobile-brand">
              <span className="hrms-brand-mark" aria-hidden="true"><span /><span /><span /></span>
              <strong>PeopleFlow</strong>
            </div>
            <p className="auth-welcome">Welcome to your HR workspace</p>
            <nav className="auth-role-tabs" aria-label="Choose login type">
              <NavLink
                to="/login/admin"
                className={({ isActive }) => `auth-role-tab${isActive ? ' auth-role-tab-active' : ''}`}
              >
                Admin
              </NavLink>
              <NavLink
                to="/login/employee"
                className={({ isActive }) => `auth-role-tab${isActive ? ' auth-role-tab-active' : ''}`}
              >
                Employee
              </NavLink>
            </nav>
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  )
}

export default AuthLayout
