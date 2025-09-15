import { TripPlanner } from "@/components/trip-planner";
import { Compass } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm bg-card">
        <div className="flex items-center justify-center">
          <Compass className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-headline font-semibold">WanderGenie</span>
        </div>
      </header>
      <main className="flex-1">
        <TripPlanner />
      </main>
      <footer className="flex items-center justify-center py-4 text-sm text-muted-foreground bg-card">
        <p>Powered by WanderGenie</p>
      </footer>
    </div>
  );
}
