import Image from 'next/image';

const MapPlaceholder = () => {
  return (
    <div className="w-full h-full bg-muted flex items-center justify-center relative">
        <Image
            src="https://picsum.photos/seed/map/600/200"
            alt="Map placeholder"
            fill
            className="object-cover opacity-50"
            data-ai-hint="world map"
        />
      <div className="z-10 text-center p-4 rounded-lg bg-black/50 text-white">
        <h3 className="font-semibold">Map View</h3>
        <p className="text-xs">Route will be displayed here</p>
      </div>
    </div>
  );
};

export default MapPlaceholder;
