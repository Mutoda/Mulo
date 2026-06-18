import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import InsurePage from './InsurePage.jsx'

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
        <Route path="/insure" element={<InsurePage />} />
        <Route path="/insure/*" element={<InsurePage />} />
      </Routes>
    </BrowserRouter>
  )
}
