
// src/app/admin/page.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import { useBooking, type Booking, Passenger } from '@/context/booking-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Briefcase, Edit, Trash2, Eye, KeyRound, Shield, Ticket, ArrowLeft } from 'lucide-react';
import type { User } from '@/context/auth-context';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';

type ActionType = 'editUser' | 'deleteUser' | 'editBooking' | 'deleteBooking';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading, getAllUsers, updateUserInList, deleteUserFromList, validatePassword } = useAuth();
  const { bookings, updateBookingInList, deleteBookingFromList } = useBooking();
  const router = useRouter();
  const { toast } = useToast();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  const [actionToConfirm, setActionToConfirm] = useState<{ type: ActionType, data: User | Booking } | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.email !== 'admin@wandergenie.com')) {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/');
    } else if (user) {
        setAllUsers(getAllUsers());
        setAllBookings(bookings);
    }
  }, [isLoading, isAuthenticated, user, router, getAllUsers, bookings, toast]);
  
  // This effect listens for changes in the underlying contexts
  useEffect(() => {
    setAllUsers(getAllUsers());
  }, [getAllUsers]);

  useEffect(() => {
    setAllBookings(bookings);
  }, [bookings]);


  const handleActionConfirmation = () => {
    if (!actionToConfirm || !validatePassword(password)) {
        toast({ title: "Authentication Failed", description: "The password you entered is incorrect.", variant: "destructive" });
        setPassword('');
        return;
    }
    
    const { type, data } = actionToConfirm;

    switch (type) {
        case 'editUser':
            updateUserInList(data as User);
            setEditingUser(null);
            toast({ title: "User Updated", description: "User details have been saved." });
            break;
        case 'deleteUser':
            deleteUserFromList((data as User).id);
            toast({ title: "User Deleted", description: "The user has been removed." });
            break;
        case 'editBooking':
            updateBookingInList(data as Booking);
            setEditingBooking(null);
            toast({ title: "Booking Updated", description: "Booking details have been saved." });
            break;
        case 'deleteBooking':
            deleteBookingFromList((data as Booking).id);
            toast({ title: "Booking Deleted", description: "The booking has been removed." });
            break;
    }

    closeConfirmationModal();
  }

  const closeConfirmationModal = () => {
    setActionToConfirm(null);
    setPassword('');
    setShowPassword(false);
  }

  if (isLoading || !user || user.email !== 'admin@wandergenie.com') {
    return <div className="text-center p-8">Loading admin dashboard...</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage users and bookings across WanderGenie.</p>
            </div>
             <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>
        
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/> Manage Users</TabsTrigger>
            <TabsTrigger value="bookings"><Briefcase className="mr-2 h-4 w-4"/> Manage Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Registered Users</CardTitle>
                <CardDescription>View, edit, and manage all user accounts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.contact || 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewingUser(u)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingUser(u)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setActionToConfirm({ type: 'deleteUser', data: u})} className="text-destructive hover:text-destructive/90"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
             <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>View, edit, and manage all trip bookings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>User Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {allBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                        <TableCell>{booking.passengerDetails.email}</TableCell>
                        <TableCell className="capitalize">{booking.type}</TableCell>
                        <TableCell>{new Date(booking.bookingDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-1">
                           <Button variant="ghost" size="icon" onClick={() => setViewingBooking(booking)}><Eye className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => setEditingBooking(booking)}><Edit className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => setActionToConfirm({ type: 'deleteBooking', data: booking})} className="text-destructive hover:text-destructive/90"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    {/* View User Modal */}
    <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>View User Details</DialogTitle>
                <DialogDescription>ID: {viewingUser?.id}</DialogDescription>
            </DialogHeader>
            {viewingUser && (
                 <div className="grid gap-4 py-4 text-sm">
                    <p><strong>Name:</strong> {viewingUser.name}</p>
                    <p><strong>Email:</strong> {viewingUser.email}</p>
                    <p><strong>Contact:</strong> {viewingUser.contact || 'N/A'}</p>
                    <p><strong>Age:</strong> {viewingUser.age || 'N/A'}</p>
                 </div>
            )}
            <DialogFooter>
                <DialogClose asChild><Button>Close</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Edit User Modal */}
    <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>ID: {editingUser?.id}</DialogDescription>
            </DialogHeader>
            {editingUser && (
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="col-span-3"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" value={editingUser.email} disabled className="col-span-3"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contact" className="text-right">Contact</Label>
                        <Input id="contact" value={editingUser.contact ?? ''} onChange={(e) => setEditingUser({...editingUser, contact: e.target.value})} className="col-span-3"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="age" className="text-right">Age</Label>
                        <Input id="age" type="number" value={editingUser.age ?? ''} onChange={(e) => setEditingUser({...editingUser, age: Number(e.target.value)})} className="col-span-3"/>
                    </div>
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={() => setActionToConfirm({type: 'editUser', data: editingUser!})}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* View Booking Modal */}
    <Dialog open={!!viewingBooking} onOpenChange={() => setViewingBooking(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>View Booking Details</DialogTitle>
                 <DialogDescription>ID: {viewingBooking?.id}</DialogDescription>
            </DialogHeader>
            {viewingBooking && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 text-sm">
                    <p><strong>Type:</strong> <span className="capitalize">{viewingBooking.type}</span></p>
                    <p><strong>Booking Date:</strong> {new Date(viewingBooking.bookingDate).toLocaleString()}</p>
                    <p><strong>Total Amount:</strong> {formatCurrency(viewingBooking.amountPaid || 0)}</p>
                    <p><strong>Transaction ID:</strong> <span className="font-mono">{viewingBooking.transactionId || 'N/A'}</span></p>
                    
                    <Separator/>
                    <h4 className="font-semibold">Passenger Details</h4>
                    <p><strong>Contact Email:</strong> {viewingBooking.passengerDetails.email}</p>
                    <p><strong>Contact Phone:</strong> {viewingBooking.passengerDetails.phone}</p>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead><TableHead>First Name</TableHead><TableHead>Last Name</TableHead><TableHead>Age</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {viewingBooking.passengerDetails.passengers.map((p: Passenger, i: number) => (
                                <TableRow key={i}><TableCell>{p.title}</TableCell><TableCell>{p.firstName}</TableCell><TableCell>{p.lastName}</TableCell><TableCell>{p.age}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {viewingBooking.seatDetails && (
                        <>
                            <Separator/>
                            <div className="flex items-center gap-2 font-semibold"><Ticket/> Seat Details</div>
                            <p><strong>PNR:</strong> <span className="font-mono">{viewingBooking.seatDetails.pnr}</span></p>
                            <p><strong>Seats:</strong> <span className="font-mono">{viewingBooking.seatDetails.seats.join(', ')}</span></p>
                        </>
                    )}
                     {viewingBooking.insuranceDetails && (
                        <>
                            <Separator/>
                            <div className="flex items-center gap-2 font-semibold"><Shield/> Insurance Details</div>
                            <p><strong>Policy ID:</strong> <span className="font-mono">{viewingBooking.insuranceDetails.policyId}</span></p>
                            <p><strong>Provider:</strong> {viewingBooking.insuranceDetails.provider}</p>
                            <p><strong>Coverage:</strong> {formatCurrency(viewingBooking.insuranceDetails.coverageAmount)}</p>
                        </>
                    )}
                </div>
            )}
             <DialogFooter>
                <DialogClose asChild><Button>Close</Button></DialogClose>
             </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Edit Booking Modal */}
    <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Booking</DialogTitle>
                 <DialogDescription>ID: {editingBooking?.id}</DialogDescription>
            </DialogHeader>
            {editingBooking && (
                 <div className="grid gap-4 py-4">
                     <p>Editing for <strong>{editingBooking.passengerDetails.email}</strong></p>
                     <p className="text-sm text-muted-foreground">This is a simplified view. All details are editable in a real application.</p>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="booking-amount" className="text-right">Amount Paid</Label>
                        <Input 
                            id="booking-amount" 
                            type="number" 
                            value={editingBooking.amountPaid} 
                            onChange={(e) => setEditingBooking({...editingBooking, amountPaid: Number(e.target.value)})} 
                            className="col-span-3"/>
                    </div>
                </div>
            )}
             <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={() => setActionToConfirm({type: 'editBooking', data: editingBooking!})}>Save Changes</Button>
             </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Action Confirmation Modal */}
    <Dialog open={!!actionToConfirm} onOpenChange={closeConfirmationModal}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center"><KeyRound className="mr-2"/>Admin Confirmation Required</DialogTitle>
                <DialogDescription>
                    To proceed with this action, please enter your admin password.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                    <Input 
                        id="admin-password" 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
                    />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(p => !p)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button variant="destructive" onClick={handleActionConfirmation}>Confirm Action</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
