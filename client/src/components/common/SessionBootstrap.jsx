import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { refreshSession } from '../../features/auth/authSlice'

let hasBootstrappedSession = false

function SessionBootstrap({ children }) {
  const dispatch = useDispatch()

  useEffect(() => {
    if (hasBootstrappedSession) {
      return
    }

    hasBootstrappedSession = true
    dispatch(refreshSession())
  }, [dispatch])

  return children
}

export default SessionBootstrap
