
// src/app/admin/page.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import { useBooking, type Booking } from '@/context/booking-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Briefcase, Edit, Trash2 } from 'lucide-react';
import type { User } from '@/context/auth-context';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading, getAllUsers, updateUserInList } = useAuth();
  const { bookings, updateBookingInList } = useBooking();
  const router = useRouter();
  const { toast } = useToast();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.email !== 'admin@wandergenie.com')) {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/');
    } else {
      setAllUsers(getAllUsers());
      setAllBookings(bookings);
    }
  }, [isLoading, isAuthenticated, user, router, getAllUsers, bookings, toast]);

  const handleUserUpdate = () => {
    if(editingUser) {
        updateUserInList(editingUser);
        setAllUsers(getAllUsers());
        toast({ title: "User Updated", description: "User details have been saved."});
        setEditingUser(null);
    }
  }
  
  const handleBookingUpdate = () => {
    if(editingBooking) {
        updateBookingInList(editingBooking);
        setAllBookings([...bookings]);
        toast({ title: "Booking Updated", description: "Booking details have been saved."});
        setEditingBooking(null);
    }
  };


  if (isLoading || !user || user.email !== 'admin@wandergenie.com') {
    return <div className="text-center p-8">Loading admin dashboard...</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-6">Manage users and bookings across WanderGenie.</p>
        
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/> Manage Users</TabsTrigger>
            <TabsTrigger value="bookings"><Briefcase className="mr-2 h-4 w-4"/> Manage Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Registered Users</CardTitle>
                <CardDescription>View and manage all user accounts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.contact || 'N/A'}</TableCell>
                        <TableCell>{u.age || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setEditingUser(u)}>
                            <Edit className="h-4 w-4" />
                          </Button>
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
                <CardDescription>View and manage all trip bookings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>User Email</TableHead>
                      <TableHead>Booking Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {allBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                        <TableCell>{booking.passengerDetails.email}</TableCell>
                        <TableCell>{new Date(booking.bookingDate).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{booking.type}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setEditingBooking(booking)}>
                            <Edit className="h-4 w-4" />
                          </Button>
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

    {/* Edit User Modal */}
    <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
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
                        <Input id="contact" value={editingUser.contact} onChange={(e) => setEditingUser({...editingUser, contact: e.target.value})} className="col-span-3"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="age" className="text-right">Age</Label>
                        <Input id="age" type="number" value={editingUser.age} onChange={(e) => setEditingUser({...editingUser, age: Number(e.target.value)})} className="col-span-3"/>
                    </div>
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleUserUpdate}>Save Changes</Button>
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
                    <p>Editing booking details is not fully implemented in this mock setup. This is a placeholder.</p>
                </div>
            )}
             <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleBookingUpdate} disabled>Save Changes</Button>
             </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
