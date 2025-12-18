import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (token && refresh) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refresh);
      setAuth(token, refresh);
      toast.success('Successfully logged in with Google!');
      navigate('/app');
    } else {
      toast.error('Authentication failed');
      navigate('/login');
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-purple-900/20">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
