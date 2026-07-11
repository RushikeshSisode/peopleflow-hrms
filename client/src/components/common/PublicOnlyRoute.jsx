import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function PublicOnlyRoute() {
  const { status, user } = useAuth()

  if (status === 'bootstrapping') {
    return (
      <div className="hrms-loading-screen">
        <div className="hrms-loading-card">
          Checking existing session...
        </div>
      </div>
    )
  }

  if (user) {
    const destination =
      user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'
    return <Navigate replace to={destination} />
  }

  return <Outlet />
}

export default PublicOnlyRoute
