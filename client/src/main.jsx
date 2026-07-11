import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/manrope/latin-700.css'
import './index.css'
import App from './App.jsx'
import { store } from './app/store'
import { setupInterceptors } from './app/setupInterceptors'
import SessionBootstrap from './components/common/SessionBootstrap'

setupInterceptors(store)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <SessionBootstrap>
          <App />
        </SessionBootstrap>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
