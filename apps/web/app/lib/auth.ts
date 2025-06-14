import { createAuthkitClient } from '@workos-inc/authkit-react';

export const authkitClient = createAuthkitClient({
  clientId: process.env.VITE_WORKOS_CLIENT_ID || '',
  redirectUri: process.env.VITE_WORKOS_REDIRECT_URI || 'http://localhost:5173/auth/callback',
  apiHostname: 'https://api.workos.com',
});