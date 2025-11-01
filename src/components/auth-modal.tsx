
// src/components/auth-modal.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalView, login, signup } = useAuth();
  const [view, setView] = useState(authModalView);
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [contact, setContact] = useState('');
  const [gender, setGender] = useState('');
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    let strength = 0;
    if (password.length > 5) strength += 1;
    if (password.length > 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength < 2) return 'bg-red-500';
    if (passwordStrength < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleAuthAction = () => {
    if (view === 'login') {
        if (!email || !password) {
            toast({title: "Email and password are required", variant: "destructive"});
            return;
        }
      login(email, password);
    } else { // signup
        if (!name || !email || !password || !confirmPassword || !age || !contact || !gender) {
            toast({title: "All fields are required for sign up", variant: "destructive"});
            return;
        }
        if (password !== confirmPassword) {
            toast({title: "Passwords do not match", variant: "destructive"});
            return;
        }
        if (passwordStrength < 3) {
            toast({title: "Password is too weak", description: "Please choose a stronger password.", variant: "destructive"});
            return;
        }
        if (contact.length !== 10) {
            toast({title: "Invalid Contact Number", description: "Contact number must be 10 digits.", variant: "destructive"});
            return;
        }
        signup({name, email, password, age: parseInt(age), contact, gender});
    }
  };
  
  // Sync internal view state with context
  React.useEffect(() => {
    setView(authModalView);
  }, [authModalView]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        closeAuthModal();
        // Reset fields on close
        setEmail('');
        setName('');
        setPassword('');
        setConfirmPassword('');
        setAge('');
        setContact('');
        setGender('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    }
  }

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{view === 'login' ? 'Log In or Sign Up' : 'Create Your Account'}</DialogTitle>
          <DialogDescription>
            {view === 'login' 
              ? "Enter your email to log in or create an account to save your bookings."
              : "Let's get you set up so you can save your trip details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-3">
          {view === 'signup' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jane Doe" />
              </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 25" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                     <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger id="gender">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
               </div>
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
           {view === 'signup' && (
            <div className="grid gap-2">
                <Label htmlFor="contact">Contact Number</Label>
                <div className="flex items-center gap-2">
                    <Select defaultValue="+91">
                        <SelectTrigger className="w-[80px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="+91">+91</SelectItem>
                            <SelectItem value="+1">+1</SelectItem>
                            <SelectItem value="+44">+44</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input id="contact" type="tel" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g., 9876543210" maxLength={10} />
                </div>
            </div>
           )}
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(p => !p)}>
                    <Eye className="h-4 w-4" />
                </Button>
            </div>
             {view === 'signup' && password.length > 0 && (
                <div className="space-y-1">
                    <Progress value={passwordStrength * 20} className={`h-1 ${getStrengthColor()}`} />
                    <p className="text-xs text-muted-foreground">
                        Password must be alphanumeric with at least one special character.
                    </p>
                </div>
            )}
          </div>
           {view === 'signup' && (
            <div className="grid gap-2">
                <Label htmlFor="confirm-password">Re-enter Password</Label>
                <div className="relative">
                    <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                     <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(p => !p)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            </div>
           )}
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
