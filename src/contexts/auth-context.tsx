import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { apiRequest } from '@/lib/api';
import { secureStorage } from '@/lib/secure-storage';
import { User, UserType, VerifyOtpResponse } from '@/lib/types';

const TOKEN_KEY = 'ripplebox_token';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  requestOtp: (phoneNumber: string) => Promise<{ debug_code: string | null }>;
  verifyOtp: (
    phoneNumber: string,
    code: string,
    name?: string,
    userType?: UserType
  ) => Promise<User>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await secureStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await apiRequest<User>('/me', { token: storedToken });
        setToken(storedToken);
        setUser(me);
      } catch {
        // Token expired, was revoked, or the API is unreachable — treat as signed out.
        await secureStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      async requestOtp(phoneNumber: string) {
        return apiRequest<{ message: string; debug_code: string | null }>('/auth/otp/request', {
          method: 'POST',
          body: { phone_number: phoneNumber },
        });
      },
      async verifyOtp(phoneNumber: string, code: string, name?: string, userType?: UserType) {
        const result = await apiRequest<VerifyOtpResponse>('/auth/otp/verify', {
          method: 'POST',
          body: {
            phone_number: phoneNumber,
            code,
            ...(name ? { name } : {}),
            ...(userType ? { user_type: userType } : {}),
          },
        });

        await secureStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
        setUser(result.user);

        return result.user;
      },
      async refreshUser() {
        if (!token) return;
        const me = await apiRequest<User>('/me', { token });
        setUser(me);
      },
      async signOut() {
        if (token) {
          await apiRequest('/auth/logout', { method: 'POST', token }).catch(() => {
            // Best-effort revoke — still clear local state even if the API call fails
            // (e.g. offline), so the user isn't stuck signed in on-device.
          });
        }

        await secureStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
      async deleteAccount() {
        if (token) {
          await apiRequest('/me', { method: 'DELETE', token });
        }

        await secureStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
