
// src/context/auth-context.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from './booking-context';

export type User = {
  id: string;
  name: string;
  email: string;
  age?: number;
  contact?: string;
  gender?: 'male' | 'female' | 'other';
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

const initialUsers: User[] = [
    { id: '0', name: 'Admin User', email: 'admin@wandergenie.com', password: 'Admin@123', gender: 'male' },
    { id: '1', name: 'Wanderer', email: 'test@example.com', password: 'Password1!', contact: '1234567890', age: 30, gender: 'female' },
];

const USERS_STORAGE_KEY = 'wandergenie-users';
const CURRENT_USER_STORAGE_KEY = 'wandergenie-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');

  const syncUsersFromStorage = useCallback(() => {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
            setAllUsers(JSON.parse(storedUsers));
        } else {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
            setAllUsers(initialUsers);
        }
    } catch (error) {
        console.error("Could not sync users from localStorage", error);
    }
  }, []);

  useEffect(() => {
    // Initial load
    syncUsersFromStorage();
    try {
        const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Could not load user from localStorage", error);
    } finally {
        setIsLoading(false);
    }

    // Listen for changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === USERS_STORAGE_KEY && event.newValue) {
            setAllUsers(JSON.parse(event.newValue));
        }
        if (event.key === CURRENT_USER_STORAGE_KEY) {
            const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
            setUser(storedUser ? JSON.parse(storedUser) : null);
        }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [syncUsersFromStorage]);

  const saveUsersToStorage = (usersToSave: User[]) => {
      setAllUsers(usersToSave);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersToSave));
  };


  const updateUser = (updatedUserDetails: Partial<User>) => {
    if (user) {
        const updatedUser = { ...user, ...updatedUserDetails };
        setUser(updatedUser);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(updatedUser));
        updateUserInList(updatedUser);
        toast({ title: "Profile Updated", description: "Your details have been successfully updated." });
    }
  }

  const getAllUsers = () => {
    return allUsers.filter(u => u.email !== 'admin@wandergenie.com');
  }

  const updateUserInList = (updatedUser: User) => {
    setAllUsers(prevUsers => {
        const userIndex = prevUsers.findIndex(u => u.id === updatedUser.id);
        let newUsers;
        if(userIndex !== -1) {
            newUsers = [...prevUsers];
            newUsers[userIndex] = updatedUser;
        } else {
            newUsers = [...prevUsers, updatedUser];
        }
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
        return newUsers;
    });
  }

  const deleteUserFromList = (userId: string) => {
    setAllUsers(prevUsers => {
        const newUsers = prevUsers.filter(u => u.id !== userId);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
        return newUsers;
    });
  }
  
  const validatePassword = (password: string) => {
    return user?.password === password;
  };

  const handlePostAuth = () => {
    closeAuthModal();
  };

  const login = (email: string, password?: string) => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser && foundUser.password === password) {
        setUser(foundUser);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(foundUser));
        toast({ title: "Login Successful", description: `Welcome back, ${foundUser.name}!` });
        handlePostAuth();
    } else {
        toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
    }
  };

  const signup = (data: SignupData) => {
    if (allUsers.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
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
      gender: data.gender,
      avatar: undefined,
    };
    
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    setUser(newUser);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser));
    toast({ title: "Account Created!", description: `Welcome to WanderGenie, ${newUser.name}!` });
    handlePostAuth();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
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
