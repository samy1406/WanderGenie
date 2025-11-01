
// src/context/auth-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from './booking-context';

export type User = {
  id: string;
  name: string;
  email: string;
  age?: number;
  contact?: string;
  avatar?: string;
  password?: string; // In a real app, this would be a hash
};

type SignupData = Omit<User, 'id' | 'avatar'>;

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  updateUser: (updatedUser: Partial<User>) => void;
  getAllUsers: () => User[];
  updateUserInList: (updatedUser: User) => void;
  deleteUserFromList: (userId: string) => void;
  validatePassword: (password: string) => boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => void;
  logout: () => void;
  signup: (data: SignupData) => void;
  openAuthModal: (view?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalView: 'login' | 'signup';
  handlePostAuth: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data - in a real app, this would be fetched from a database
let MOCK_USERS: User[] = [
    { id: '0', name: 'Admin User', email: 'admin@wandergenie.com', password: 'Admin@123' },
    { id: '1', name: 'Wanderer', email: 'test@example.com', password: 'Password1!', contact: '1234567890', age: 30 },
];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');

  const syncUsers = () => {
    try {
        const storedUsers = localStorage.getItem('wandergenie-users');
        if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);
            const combinedUsers = [...MOCK_USERS];
            parsedUsers.forEach((su: User) => {
                if (!combinedUsers.some(u => u.email === su.email)) {
                    combinedUsers.push(su);
                }
            });
            MOCK_USERS = combinedUsers;
        } else {
            localStorage.setItem('wandergenie-users', JSON.stringify(MOCK_USERS));
        }
    } catch (error) {
        console.error("Could not sync users from localStorage", error);
    }
  }

  useEffect(() => {
    try {
        syncUsers();
        const storedUser = localStorage.getItem('wandergenie-user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Could not load user from localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const updateUser = (updatedUserDetails: Partial<User>) => {
    if (user) {
        const updatedUser = { ...user, ...updatedUserDetails };
        setUser(updatedUser);
        localStorage.setItem('wandergenie-user', JSON.stringify(updatedUser));
        updateUserInList(updatedUser);
        toast({ title: "Profile Updated", description: "Your details have been successfully updated." });
    }
  }

  const getAllUsers = () => {
    syncUsers();
    return MOCK_USERS.filter(u => u.email !== 'admin@wandergenie.com'); // Don't show admin in user list
  }

  const updateUserInList = (updatedUser: User) => {
    const userIndex = MOCK_USERS.findIndex(u => u.id === updatedUser.id);
    if(userIndex !== -1) {
        MOCK_USERS[userIndex] = updatedUser;
        localStorage.setItem('wandergenie-users', JSON.stringify(MOCK_USERS));
    }
  }

  const deleteUserFromList = (userId: string) => {
    MOCK_USERS = MOCK_USERS.filter(u => u.id !== userId);
    localStorage.setItem('wandergenie-users', JSON.stringify(MOCK_USERS));
  }
  
  const validatePassword = (password: string) => {
    return user?.password === password;
  };

  const handlePostAuth = () => {
    // This is now just a simple function to close the modal.
    // The component that initiated the auth flow is responsible
    // for checking isAuthenticated and proceeding with its action.
    closeAuthModal();
  };

  const login = (email: string, password?: string) => {
    syncUsers(); // Make sure we have the latest user list
    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser && foundUser.password === password) {
        setUser(foundUser);
        localStorage.setItem('wandergenie-user', JSON.stringify(foundUser));
        toast({ title: "Login Successful", description: `Welcome back, ${foundUser.name}!` });
        handlePostAuth();
    } else {
        toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
    }
  };

  const signup = (data: SignupData) => {
    if (MOCK_USERS.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        toast({ title: "Signup Failed", description: "An account with this email already exists.", variant: "destructive" });
        return;
    }
    const newUser: User = {
      id: `${Date.now()}`,
      name: data.name,
      email: data.email,
      password: data.password,
      age: data.age,
      contact: data.contact,
      avatar: undefined, // Explicitly set avatar to undefined
    };
    
    MOCK_USERS.push(newUser);
    localStorage.setItem('wandergenie-users', JSON.stringify(MOCK_USERS));
    
    setUser(newUser);
    localStorage.setItem('wandergenie-user', JSON.stringify(newUser));
    toast({ title: "Account Created!", description: `Welcome to WanderGenie, ${newUser.name}!` });
    handlePostAuth();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wandergenie-user');
    router.push('/');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
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
    updateUser,
    getAllUsers,
    updateUserInList,
    deleteUserFromList,
    validatePassword,
    isLoading,
    login,
    logout,
    signup,
    openAuthModal,
    closeAuthModal,
    isAuthModalOpen,
    authModalView,
    handlePostAuth,
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
