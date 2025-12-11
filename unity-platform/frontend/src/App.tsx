import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MainApp } from './pages/MainApp';
import Home from './pages/HomeMOT';
import { InvitePage } from './pages/InvitePage';
import { useAuthStore } from './store/authStore';
import { useVoiceUsersStore } from './store/voiceUsersStore';
import { VoiceChatProvider } from './components/VoiceChat/VoiceChatProvider';
import { useGlobalKeybinds } from './hooks/useGlobalKeybinds';

function App() {
  const { isAuthenticated, isInitialized, fetchCurrentUser } = useAuthStore();
  const initializeVoiceListeners = useVoiceUsersStore(state => state.initializeListeners);
  
  // Initialize global keybinds for voice shortcuts
  useGlobalKeybinds();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Initialize voice channel user listeners
  useEffect(() => {
    initializeVoiceListeners();
  }, [initializeVoiceListeners]);

  // Show loading screen while checking for existing session
  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-mot-black">
        <div className="text-center">
          <img src="/MOT.gif" alt="MOT" className="h-28 w-auto mx-auto mb-6" />
          <div className="w-12 h-12 border-4 border-mot-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading MOT...</p>
        </div>
      </div>
    );
  } 

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#141416',
            color: '#fff',
            border: '1px solid #2A2A2E'
          },
          success: {
            iconTheme: {
              primary: '#F5A623',
              secondary: '#0A0A0B',
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
        <Route path="/invite/:code" element={<InvitePage />} />
        <Route
          path="/app/*"
          element={
            isAuthenticated ? (
              <VoiceChatProvider>
                <MainApp />
              </VoiceChatProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
