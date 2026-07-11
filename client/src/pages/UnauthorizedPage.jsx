import { Link } from 'react-router-dom'

function UnauthorizedPage() {
  return (
    <div className="hrms-loading-screen px-6">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/50">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-amber-50 text-amber-600">
          <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3 5 6v5c0 4.7 2.9 8.1 7 10 4.1-1.9 7-5.3 7-10V6l-7-3ZM9.5 12l1.5 1.5 3.5-3.5" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
          Access restricted
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your account does not have permission to open this workspace.
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

export default UnauthorizedPage
