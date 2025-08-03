import React from 'react';
import Masonry from 'react-masonry-css';
import PinCard from './PinCard';

interface Pin {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link?: string;
  likes_count: number;
  saves_count: number;
  users: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

interface MasonryGridProps {
  pins: Pin[];
  onPinUpdate?: (pinId: string, updates: Partial<Pin>) => void;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ pins, onPinUpdate }) => {
  const breakpointColumnsObj = {
    default: 5,
    1280: 4,
    1024: 3,
    768: 2,
    640: 1
  };

  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📌</span>
        </div>
        <h3 className="text-lg font-medium mb-2">No pins found</h3>
        <p className="text-sm">Try adjusting your search or create a new pin</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {pins.map((pin) => (
          <PinCard 
            key={pin.id} 
            pin={pin} 
            onPinUpdate={onPinUpdate}
          />
        ))}
      </Masonry>
    </div>
  );
};

export default MasonryGrid;