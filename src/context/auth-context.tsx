// src/context/auth-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useBooking } from './booking-context';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
  signup: (name: string, email: string) => void;
  openAuthModal: (view?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalView: 'login' | 'signup';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data - in a real app, this would be fetched from a database
const MOCK_USERS: User[] = [
    { id: '1', name: 'Wanderer', email: 'test@example.com', avatar: `https://i.pravatar.cc/150?u=test@example.com` },
];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addBooking, pendingBooking, clearPendingBooking } = useBooking();
  const router = useRouter();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    // Simulate checking for a logged-in user in localStorage
    const storedUser = localStorage.getItem('wandergenie-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string) => {
    const foundUser = MOCK_USERS.find(u => u.email === email);
    if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('wandergenie-user', JSON.stringify(foundUser));
        handlePostAuth();
    } else {
        // For this demo, if user not found, create them.
        signup(`User ${MOCK_USERS.length + 1}`, email);
    }
  };

  const signup = (name: string, email: string) => {
    const newUser: User = {
      id: `${MOCK_USERS.length + 1}`,
      name,
      email,
      avatar: `https://i.pravatar.cc/150?u=${email}`
    };
    MOCK_USERS.push(newUser);
    setUser(newUser);
    localStorage.setItem('wandergenie-user', JSON.stringify(newUser));
    handlePostAuth();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wandergenie-user');
    router.push('/');
  };

  const handlePostAuth = () => {
    if (pendingBooking) {
      addBooking(pendingBooking);
      clearPendingBooking();
      closeAuthModal();
      router.push('/my-bookings');
    } else {
      closeAuthModal();
    }
  };

  const openAuthModal = (view: 'login' | 'signup' = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };


  const value = {
    isAuthenticated: !!user,
    user,
    isLoading,
    login,
    logout,
    signup,
    openAuthModal,
    closeAuthModal,
    isAuthModalOpen,
    authModalView,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
