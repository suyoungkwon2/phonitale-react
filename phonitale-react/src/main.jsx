import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import 'antd/dist/reset.css'
import { ExperimentProvider } from './context/ExperimentContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ExperimentProvider>
        <App />
      </ExperimentProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
