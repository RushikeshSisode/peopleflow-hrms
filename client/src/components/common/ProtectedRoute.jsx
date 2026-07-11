import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function ProtectedRoute({ allowedRoles }) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'bootstrapping') {
    return (
      <div className="hrms-loading-screen">
        <div className="hrms-loading-card">
          Preparing your workspace...
        </div>
      </div>
    )
  }

  if (!user) {
    const loginPath = location.pathname.startsWith('/admin')
      ? '/login/admin'
      : '/login/employee'

    return <Navigate replace to={loginPath} state={{ from: location }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to="/unauthorized" />
  }

  return <Outlet />
}

export default ProtectedRoute
