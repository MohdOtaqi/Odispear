import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UnifiedApp } from './pages/UnifiedApp';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#2b2d31',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/app"
          element={
            isAuthenticated ? <UnifiedApp /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
