import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { useAuth } from '@workos-inc/authkit-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useAuth();

  useEffect(() => {
    handleRedirectCallback().then(() => {
      navigate('/dashboard');
    });
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-gray-600">Authenticating...</div>
    </div>
  );
}