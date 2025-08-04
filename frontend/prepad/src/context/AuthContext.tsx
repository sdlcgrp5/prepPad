'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import Cookies from 'js-cookie';

type User = {
  id: number;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, confirmPassword: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();


  // Check for existing session on component mount (JWT or NextAuth)
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    // Check for NextAuth session first
    if (session?.user) {
      setUser({
        id: Number(session.user.id),
        email: session.user.email || '',
        name: session.user.name || '',
      });
      setToken('nextauth'); // Use a placeholder token for NextAuth sessions
      setIsLoading(false);
      return;
    }

    // Fallback to JWT token from cookies
    const storedToken = Cookies.get('auth_token');
    const storedUser = Cookies.get('user') ? JSON.parse(Cookies.get('user') || '{}') : null;
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    
    // Add a small delay to ensure session is fully loaded
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, [session, status]);

  // Signup function
  const signup = async (email: string, password: string, confirmPassword: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to signup');
      }
      
      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      
      // Store in cookies
      Cookies.set('auth_token', data.token, { 
         expires: 1,
         // secure: true,         // Only transmit over HTTPS
         sameSite: 'strict',   // Prevent CSRF attacks
         httpOnly: true,       // Not accessible via JavaScript (requires server-side implementation)
         path: '/'             // Limit cookie to specific path
       });
       
       Cookies.set('user', JSON.stringify(data.user), { 
         expires: 1,
        // secure: true,
         sameSite: 'strict',
         path: '/'
       });
      
      // Direct user to resume upload page to complete their profile
      router.push('/resumeupload');
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }
      
      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      
      // Store in cookies
      Cookies.set('auth_token', data.token, { expires: 1 }); // 1 day
      Cookies.set('user', JSON.stringify(data.user), { expires: 1 });
      
      // Check if profile exists
      try {
        const profileResponse = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        
        // If profile exists, go to dashboard, otherwise go to resume upload
        router.push(profileResponse.ok ? '/dashboard' : '/resumeupload');
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, default to resume upload
        router.push('/resumeupload');
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Google login function - let NextAuth handle the redirect
  const loginWithGoogle = async () => {
    try {
      await signIn('google', { 
        callbackUrl: '/resumeupload',
        redirect: true 
      });
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  // Enhanced logout function for both auth methods
  const logout = async () => {
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear JWT cookies
    Cookies.remove('auth_token');
    Cookies.remove('user');
    
    // Sign out from NextAuth if session exists
    if (session) {
      await signOut({ callbackUrl: '/' });
    } else {
      // Redirect to home page for JWT logout
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}