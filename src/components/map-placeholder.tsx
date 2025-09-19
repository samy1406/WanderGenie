import Image from 'next/image';

const MapPlaceholder = ({ origin, destination }: { origin: string, destination: string }) => {
  const mapImageUrl = `https://picsum.photos/seed/${origin.toLowerCase()}-${destination.toLowerCase()}/600/200`;

  return (
    <div className="w-full h-full bg-muted flex items-center justify-center relative">
        <Image
            src={mapImageUrl}
            alt={`Map from ${origin} to ${destination}`}
            fill
            className="object-cover opacity-70"
            data-ai-hint="city map route"
            key={`${origin}-${destination}`} // Add key to force re-render on change
        />
      <div className="z-10 text-center p-4 rounded-lg bg-black/50 text-white">
        <h3 className="font-semibold text-xl">Map: {origin} to {destination}</h3>
        <p className="text-xs">Your route will be displayed here</p>
      </div>
    </div>
  );
};

export default MapPlaceholder;
