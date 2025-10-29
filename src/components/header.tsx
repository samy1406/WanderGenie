// src/components/header.tsx
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LayoutGrid, LogOut, Briefcase, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { isAuthenticated, user, logout, openAuthModal } = useAuth();
  const router = useRouter();

  const getInitials = (name = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleMyBookingsClick = () => {
    router.push('/my-bookings');
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <Link href="/" className="flex items-center gap-2">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-primary">WanderGenie</span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleMyBookingsClick}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  <span>My Bookings</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => openAuthModal('login')}>Log in</Button>
              <Button onClick={() => openAuthModal('signup')}>Sign up</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
