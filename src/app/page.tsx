import { TripPlanner } from "@/components/trip-planner";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        <TripPlanner />
      </main>
    </div>
  );
}
