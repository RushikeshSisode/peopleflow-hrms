import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="hrms-loading-screen px-6">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/50">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-blue-50 text-xl font-bold text-blue-600">
          404
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The page you requested is not available. Choose a sign-in portal to continue.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700" to="/login/admin">
            Admin login
          </Link>
          <Link className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" to="/login/employee">
            Employee login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
