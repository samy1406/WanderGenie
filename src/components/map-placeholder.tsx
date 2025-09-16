import Image from 'next/image';

const MapPlaceholder = ({ destination }: { destination: string }) => {
  const mapImageUrl = `https://picsum.photos/seed/${destination.toLowerCase().replace(/\s/g, '-')}/600/200`;

  return (
    <div className="w-full h-full bg-muted flex items-center justify-center relative">
        <Image
            src={mapImageUrl}
            alt={`Map of ${destination}`}
            fill
            className="object-cover opacity-50"
            data-ai-hint="city map"
            key={destination} // Add key to force re-render on destination change
        />
      <div className="z-10 text-center p-4 rounded-lg bg-black/50 text-white">
        <h3 className="font-semibold">Map of {destination}</h3>
        <p className="text-xs">Route will be displayed here</p>
      </div>
    </div>
  );
};

export default MapPlaceholder;
