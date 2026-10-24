import { SnackbarProvider } from 'notistack'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'

import './styles/shadcn.css'
import './styles/global.css'
import App from './App'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <Router>
    <SnackbarProvider maxSnack={3}>
      <App />
    </SnackbarProvider>
  </Router>
)
