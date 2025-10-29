// src/components/auth-modal.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalView, login, signup } = useAuth();
  const [view, setView] = useState(authModalView);
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const { toast } = useToast();

  const handleAuthAction = () => {
    if (view === 'login') {
        if (!email) {
            toast({title: "Email is required", variant: "destructive"});
            return;
        }
      login(email);
    } else {
        if (!name || !email) {
            toast({title: "Name and email are required", variant: "destructive"});
            return;
        }
      signup(name, email);
    }
  };
  
  // Sync internal view state with context
  React.useEffect(() => {
    setView(authModalView);
  }, [authModalView]);

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{view === 'login' ? 'Log In or Sign Up' : 'Create Your Account'}</DialogTitle>
          <DialogDescription>
            {view === 'login' 
              ? "Enter your email to log in or create an account to save your bookings."
              : "Let's get you set up so you can save your trip details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {view === 'signup' && (
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jane Doe" />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button onClick={handleAuthAction}>
            {view === 'login' ? 'Continue with Email' : 'Sign Up'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {view === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setView(view === 'login' ? 'signup' : 'login')}
              className="font-semibold text-primary hover:underline"
            >
              {view === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
