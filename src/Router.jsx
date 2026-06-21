import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import InsurePage from './InsurePage.jsx'
import AdminPage from './AdminPage.jsx'
import InsureDashboard from './InsureDashboard.jsx'

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/insure" element={<InsurePage />} />
        <Route path="/insure/*" element={<InsurePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  )
}
