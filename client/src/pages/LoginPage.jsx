import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginAdmin, loginEmployee } from '../features/auth/authSlice'
import { useAuth } from '../hooks/useAuth'

const roleContent = {
  admin: {
    eyebrow: 'Administrator portal',
    title: 'Sign in to manage your workplace',
    description: 'Access employee records, approvals, policies, attendance reports, and payroll.',
  },
  employee: {
    eyebrow: 'Employee self service',
    title: 'Sign in to your workspace',
    description: 'Access attendance, leave requests, holidays, and your salary slips.',
  },
}

function LoginPage({ role }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loginStatus, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const content = roleContent[role]
  const nextPath =
    location.state?.from?.pathname ||
    (role === 'admin' ? '/admin/dashboard' : '/employee/dashboard')

  async function handleSubmit(event) {
    event.preventDefault()

    const action = role === 'admin' ? loginAdmin : loginEmployee
    const resultAction = await dispatch(action(formData))

    if (action.fulfilled.match(resultAction)) {
      navigate(nextPath, { replace: true })
    }
  }

  return (
    <div className="login-card">
      <div className="login-card-heading">
        <span>{content.eyebrow}</span>
        <h2>{content.title}</h2>
        <p>{content.description}</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field">
          <span>Email address</span>
          <div className="login-input-wrap">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m4 6 8 6 8-6" />
            </svg>
            <input
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(event) =>
                setFormData((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="name@company.com"
            />
          </div>
        </label>

        <label className="login-field">
          <span>Password</span>
          <div className="login-input-wrap">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="4" y="10" width="16" height="11" rx="2" strokeWidth="1.8" />
              <path strokeLinecap="round" strokeWidth="1.8" d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={(event) =>
                setFormData((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        {error ? (
          <div className="login-error" role="alert">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
              <path strokeLinecap="round" strokeWidth="1.8" d="M12 8v5M12 16.5h.01" />
            </svg>
            <span>{error}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loginStatus === 'loading'}
          className="login-submit"
        >
          {loginStatus === 'loading' ? (
            <><span className="login-spinner" /> Signing in...</>
          ) : (
            <>Sign in securely <span aria-hidden="true">→</span></>
          )}
        </button>
      </form>

    </div>
  )
}

export default LoginPage
