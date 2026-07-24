import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import ViewDocument from './components/ViewDocument'
import Workbench from './components/Workbench'
import ReviewManagement from './components/ReviewManagement'

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/workbench" element={<Workbench />} />
        <Route path="/review-management" element={<ReviewManagement />} />
        <Route path="/document" element={<ViewDocument />} />
        <Route path="*" element={<Navigate to="/workbench" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
