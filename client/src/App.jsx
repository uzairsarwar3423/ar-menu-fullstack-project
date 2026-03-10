import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages for code splitting
const Menu = lazy(() => import('./pages/Menu'));
const ARView = lazy(() => import('./pages/ARView'));

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
    </Router>
  );
}

export default App;
