
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { Header } from '@/components/header';
import { BookingProvider } from '@/context/booking-context';
import { TripProvider } from '@/context/trip-context';

export const metadata: Metadata = {
  title: 'WanderGenie',
  description: 'Your AI-powered personalized trip planner',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v9.2.4/ol.css" />
      </head>
      <body className="font-body antialiased">
        <BookingProvider>
          <AuthProvider>
            <TripProvider>
              <Header />
              {children}
              <Toaster />
            </TripProvider>
          </AuthProvider>
        </BookingProvider>
      </body>
    </html>
  );
}
