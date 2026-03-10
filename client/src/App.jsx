import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './pages/Menu';
import ARView from './pages/ARView';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect / to /menu */}
        <Route path="/" element={<Navigate to="/menu" replace />} />
        
        {/* Menu Page */}
        <Route path="/menu" element={<Menu />} />
        
        {/* AR View Page */}
        <Route path="/ar/:itemId" element={<ARView />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </Router>
  );
}

export default App;